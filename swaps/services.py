import datetime
from django.conf import settings
from django.db import transaction
from django.db.models import Avg, Sum
from django.utils import timezone

from accounts.models import User
from swaps.models import Delivery, LedgerEntry, Message, Notification, Review, SwapRequest


class SwapRuleError(Exception):
    """Raised when a swap business rule is violated (HTTP 400 or 409)."""
    def __init__(self, message, status_code=400):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


class SwapPermissionError(Exception):
    """Raised when a user is not permitted to perform the swap action (HTTP 403)."""
    def __init__(self, message="You do not have permission for this action."):
        super().__init__(message)
        self.message = message
        self.status_code = 403


def get_user_balances(user):
    """
    Computes derived balances from append-only ledger and active swaps.
    - available: sum of all ledger entry amounts for the user.
    - escrow: sum of credit_amount of swaps where user is requester in requested/in_progress/review.
    - earned: sum of EARN ledger entries for the user.
    - spent: sum of credit_amount for completed swaps where user was requester.
    """
    available = (
        LedgerEntry.objects.filter(user=user).aggregate(total=Sum("amount"))["total"] or 0
    )
    escrow = (
        SwapRequest.objects.filter(
            requester=user,
            status__in=[
                SwapRequest.STATUS_REQUESTED,
                SwapRequest.STATUS_IN_PROGRESS,
                SwapRequest.STATUS_REVIEW,
            ],
        ).aggregate(total=Sum("credit_amount"))["total"]
        or 0
    )
    earned = (
        LedgerEntry.objects.filter(
            user=user,
            type=LedgerEntry.TYPE_EARN,
        ).aggregate(total=Sum("amount"))["total"]
        or 0
    )
    spent = (
        SwapRequest.objects.filter(
            requester=user,
            status=SwapRequest.STATUS_COMPLETED,
        ).aggregate(total=Sum("credit_amount"))["total"]
        or 0
    )

    return {
        "available": available,
        "escrow": escrow,
        "earned": earned,
        "spent": spent,
    }


def get_user_reputation(user):
    """
    Computes average rating, review count, and completed swaps as provider.
    """
    agg = Review.objects.filter(recipient=user).aggregate(
        avg_score=Avg("score"),
    )
    avg_score = agg["avg_score"]
    rating = round(avg_score, 1) if avg_score is not None else None
    review_count = Review.objects.filter(recipient=user).count()
    completed_as_provider = SwapRequest.objects.filter(
        provider=user,
        status=SwapRequest.STATUS_COMPLETED,
    ).count()

    return {
        "rating": rating,
        "review_count": review_count,
        "completed_swaps": completed_as_provider,
    }


@transaction.atomic
def register_user(email, password, full_name="", headline="", bio="", location=""):
    """
    Creates a new user and grants SIGNUP_BONUS_CREDITS (300) in the same transaction.
    """
    email = email.strip().lower()
    if User.objects.filter(email=email).exists():
        raise SwapRuleError("An account with this email already exists.", status_code=400)

    user = User(
        email=email,
        full_name=full_name.strip(),
        headline=headline.strip(),
        bio=bio.strip(),
        location=location.strip(),
    )
    user.set_password(password)
    user.save()

    bonus = getattr(settings, "SIGNUP_BONUS_CREDITS", 300)
    LedgerEntry.objects.create(
        user=user,
        swap=None,
        type=LedgerEntry.TYPE_SIGNUP_BONUS,
        amount=bonus,
        description=f"Welcome bonus: {bonus} Swap Credits",
    )

    Notification.objects.create(
        user=user,
        title="Welcome to Swapski!",
        body=f"Your account is ready with {bonus} starting Swap Credits. Explore the marketplace to hire or publish your skills to earn more.",
        link="wallet",
    )

    return user


@transaction.atomic
def create_swap(requester, service, message):
    """
    Requester hires a service.
    - Service must be active and not owned by requester.
    - No existing open swap by requester for this service.
    - Requester must have available >= credit_amount.
    - Deducts credits via ESCROW_LOCK ledger entry.
    - Posts first chat message and notifies provider.
    """
    if not message or not message.strip():
        raise SwapRuleError("A message describing what you need is required.")

    # Lock requester row
    requester = User.objects.select_for_update().get(pk=requester.pk)

    if not service.is_active:
        raise SwapRuleError("This service is no longer active.")

    if service.owner_id == requester.pk:
        raise SwapRuleError("You cannot request your own service.")

    # Check for existing open swap for this service
    has_open_swap = SwapRequest.objects.filter(
        requester=requester,
        service=service,
        status__in=[
            SwapRequest.STATUS_REQUESTED,
            SwapRequest.STATUS_IN_PROGRESS,
            SwapRequest.STATUS_REVIEW,
        ],
    ).exists()
    if has_open_swap:
        raise SwapRuleError("You already have an active swap open for this service.", status_code=409)

    balances = get_user_balances(requester)
    cost = service.credit_cost
    if balances["available"] < cost:
        diff = cost - balances["available"]
        raise SwapRuleError(
            f"Insufficient credits. You need {diff} more credits to request this service. Publish a service to earn more!",
            status_code=400,
        )

    now = timezone.now()
    swap = SwapRequest.objects.create(
        requester=requester,
        provider=service.owner,
        service=service,
        service_title=service.title,
        credit_amount=cost,
        status=SwapRequest.STATUS_REQUESTED,
        requester_read_at=now,
    )

    # Append-only ledger lock
    LedgerEntry.objects.create(
        user=requester,
        swap=swap,
        type=LedgerEntry.TYPE_ESCROW_LOCK,
        amount=-cost,
        description=f"Escrow locked for swap: {swap.service_title}",
    )

    # First chat message
    Message.objects.create(
        swap=swap,
        sender=requester,
        body=message.strip(),
        is_system=False,
    )

    # System confirmation message
    Message.objects.create(
        swap=swap,
        sender=None,
        body=f"Escrow confirmed. {cost} Swap Credits are locked and waiting for provider acceptance.",
        is_system=True,
    )

    # Notification to provider
    Notification.objects.create(
        user=service.owner,
        title="New swap request",
        body=f"{requester.full_name or requester.display_handle} requested '{swap.service_title}' ({cost} credits).",
        link=f"swaps/{swap.id}",
    )

    return swap


@transaction.atomic
def accept_swap(user, swap_id):
    """
    Provider accepts the swap request.
    status: requested -> in_progress
    sets accepted_at and due_at = accepted_at + service.delivery_days.
    """
    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)

    if swap.provider_id != user.pk:
        raise SwapPermissionError("Only the provider can accept this swap.")

    if swap.status != SwapRequest.STATUS_REQUESTED:
        raise SwapRuleError(f"Cannot accept swap in status '{swap.status}'.", status_code=409)

    now = timezone.now()
    delivery_days = swap.service.delivery_days if swap.service else 3
    due_at = now + datetime.timedelta(days=delivery_days)

    swap.status = SwapRequest.STATUS_IN_PROGRESS
    swap.accepted_at = now
    swap.due_at = due_at
    swap.provider_read_at = now
    swap.save(update_fields=["status", "accepted_at", "due_at", "provider_read_at", "updated_at"])

    Message.objects.create(
        swap=swap,
        sender=None,
        body=f"Request accepted by {user.full_name or user.display_handle}. Work is in progress (due {due_at.strftime('%b %d')}).",
        is_system=True,
    )

    Notification.objects.create(
        user=swap.requester,
        title="Swap accepted",
        body=f"{user.full_name or user.display_handle} accepted your request for '{swap.service_title}'.",
        link=f"swaps/{swap.id}",
    )

    return swap


@transaction.atomic
def decline_swap(user, swap_id):
    """
    Provider declines the swap request.
    status: requested -> declined
    credits refunded to requester via REFUND ledger entry.
    """
    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)
    requester = User.objects.select_for_update().get(pk=swap.requester_id)

    if swap.provider_id != user.pk:
        raise SwapPermissionError("Only the provider can decline this swap.")

    if swap.status != SwapRequest.STATUS_REQUESTED:
        raise SwapRuleError(f"Cannot decline swap in status '{swap.status}'.", status_code=409)

    swap.status = SwapRequest.STATUS_DECLINED
    swap.save(update_fields=["status", "updated_at"])

    LedgerEntry.objects.create(
        user=requester,
        swap=swap,
        type=LedgerEntry.TYPE_REFUND,
        amount=swap.credit_amount,
        description=f"Refund: swap declined for '{swap.service_title}'",
    )

    Message.objects.create(
        swap=swap,
        sender=None,
        body=f"Request declined by {user.full_name or user.display_handle}. {swap.credit_amount} Swap Credits refunded.",
        is_system=True,
    )

    Notification.objects.create(
        user=requester,
        title="Swap request declined",
        body=f"Your request for '{swap.service_title}' was declined. {swap.credit_amount} credits have been refunded.",
        link=f"swaps/{swap.id}",
    )

    return swap


@transaction.atomic
def cancel_swap(user, swap_id):
    """
    Requester cancels the swap request before it is accepted.
    status: requested -> cancelled
    credits refunded to requester via REFUND ledger entry.
    """
    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)
    requester = User.objects.select_for_update().get(pk=swap.requester_id)

    if swap.requester_id != user.pk:
        raise SwapPermissionError("Only the requester can cancel this swap.")

    if swap.status != SwapRequest.STATUS_REQUESTED:
        raise SwapRuleError(f"Cannot cancel swap in status '{swap.status}'.", status_code=409)

    swap.status = SwapRequest.STATUS_CANCELLED
    swap.save(update_fields=["status", "updated_at"])

    LedgerEntry.objects.create(
        user=requester,
        swap=swap,
        type=LedgerEntry.TYPE_REFUND,
        amount=swap.credit_amount,
        description=f"Refund: swap cancelled by requester for '{swap.service_title}'",
    )

    Message.objects.create(
        swap=swap,
        sender=None,
        body=f"Request cancelled by {requester.full_name or requester.display_handle}. {swap.credit_amount} Swap Credits refunded.",
        is_system=True,
    )

    Notification.objects.create(
        user=swap.provider,
        title="Swap request cancelled",
        body=f"{requester.full_name or requester.display_handle} cancelled their request for '{swap.service_title}'.",
        link=f"swaps/{swap.id}",
    )

    return swap


@transaction.atomic
def deliver_swap(user, swap_id, link="", note="", file=None):
    """
    Provider delivers the work.
    status: in_progress -> review
    Delivery record created with link, note, and/or file.
    """
    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)

    if swap.provider_id != user.pk:
        raise SwapPermissionError("Only the provider can submit deliverables.")

    if swap.status != SwapRequest.STATUS_IN_PROGRESS:
        raise SwapRuleError(f"Cannot deliver work when swap is '{swap.status}'.", status_code=409)

    link = (link or "").strip()
    note = (note or "").strip()

    if not link and not note and not file:
        raise SwapRuleError("You must provide at least a link, note, or file for delivery.")

    if file:
        max_size = getattr(settings, "MAX_DELIVERY_FILE_SIZE", 5 * 1024 * 1024)
        if file.size > max_size:
            raise SwapRuleError("Delivery file exceeds maximum 5 MB limit.")
        ext = file.name.split(".")[-1].lower() if "." in file.name else ""
        allowed = getattr(
            settings,
            "ALLOWED_DELIVERY_EXTENSIONS",
            {"pdf", "png", "jpg", "jpeg", "zip", "docx", "pptx", "xlsx", "txt", "md", "mp4"},
        )
        if ext not in allowed:
            raise SwapRuleError(f"File extension '.{ext}' is not allowed.")

    delivery = Delivery.objects.create(
        swap=swap,
        link=link,
        note=note,
        file=file,
        created_by=user,
    )

    swap.status = SwapRequest.STATUS_REVIEW
    swap.save(update_fields=["status", "updated_at"])

    summary_parts = []
    if link:
        summary_parts.append(f"link: {link}")
    if file:
        summary_parts.append(f"file: {file.name}")
    summary_txt = f" ({', '.join(summary_parts)})" if summary_parts else ""

    Message.objects.create(
        swap=swap,
        sender=user,
        body=f"Submitted deliverable{summary_txt}.\n{note}".strip(),
        is_system=False,
    )

    Message.objects.create(
        swap=swap,
        sender=None,
        body=f"Deliverable submitted by {user.full_name or user.display_handle}. Swap is now under review.",
        is_system=True,
    )

    Notification.objects.create(
        user=swap.requester,
        title="Deliverable ready for review",
        body=f"{user.full_name or user.display_handle} submitted work for '{swap.service_title}'. Please review and approve.",
        link=f"swaps/{swap.id}",
    )

    return delivery


@transaction.atomic
def request_changes(user, swap_id, note):
    """
    Requester asks for revisions during review.
    status: review -> in_progress
    Requires a short note, posted to chat.
    """
    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)

    if swap.requester_id != user.pk:
        raise SwapPermissionError("Only the requester can request changes.")

    if swap.status != SwapRequest.STATUS_REVIEW:
        raise SwapRuleError(f"Cannot request changes when status is '{swap.status}'.", status_code=409)

    note = (note or "").strip()
    if not note:
        raise SwapRuleError("Please provide a note explaining what revisions are needed.")

    swap.status = SwapRequest.STATUS_IN_PROGRESS
    swap.save(update_fields=["status", "updated_at"])

    Message.objects.create(
        swap=swap,
        sender=user,
        body=f"Revision request: {note}",
        is_system=False,
    )

    Message.objects.create(
        swap=swap,
        sender=None,
        body=f"Revisions requested by {user.full_name or user.display_handle}. Swap moved back to in progress.",
        is_system=True,
    )

    Notification.objects.create(
        user=swap.provider,
        title="Changes requested",
        body=f"{user.full_name or user.display_handle} requested revisions on '{swap.service_title}'.",
        link=f"swaps/{swap.id}",
    )

    return swap


@transaction.atomic
def approve_swap(user, swap_id):
    """
    Requester approves the deliverables.
    status: review -> completed
    releases credits to provider via EARN entry.
    Must be idempotent: calling twice under row lock never pays twice.
    """
    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)

    if swap.requester_id != user.pk:
        raise SwapPermissionError("Only the requester can approve this swap.")

    # Idempotence check
    if swap.status == SwapRequest.STATUS_COMPLETED:
        return swap

    if swap.status != SwapRequest.STATUS_REVIEW:
        raise SwapRuleError(f"Cannot approve swap in status '{swap.status}'.", status_code=409)

    provider = User.objects.select_for_update().get(pk=swap.provider_id)
    now = timezone.now()

    swap.status = SwapRequest.STATUS_COMPLETED
    swap.completed_at = now
    swap.save(update_fields=["status", "completed_at", "updated_at"])

    # Release credits to provider
    LedgerEntry.objects.create(
        user=provider,
        swap=swap,
        type=LedgerEntry.TYPE_EARN,
        amount=swap.credit_amount,
        description=f"Earned from completed swap: {swap.service_title}",
    )

    Message.objects.create(
        swap=swap,
        sender=None,
        body=f"Swap approved! {swap.credit_amount} Swap Credits have been released to {provider.full_name or provider.display_handle}.",
        is_system=True,
    )

    Notification.objects.create(
        user=provider,
        title="Swap approved · Credits earned!",
        body=f"{user.full_name or user.display_handle} approved '{swap.service_title}'. You earned {swap.credit_amount} Swap Credits!",
        link=f"swaps/{swap.id}",
    )

    Notification.objects.create(
        user=swap.requester,
        title="Swap completed",
        body=f"You approved '{swap.service_title}'. Please leave a review for {provider.full_name or provider.display_handle}.",
        link=f"swaps/{swap.id}",
    )

    return swap


@transaction.atomic
def create_review(user=None, swap_id=None, score=5, text="", author=None):
    """
    Creates a 1-5 star review for the other party after completion.
    Unique per (swap, author).
    """
    if user is None:
        user = author
    if user is None:
        raise SwapRuleError("Review author is required.")

    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)

    if swap.status != SwapRequest.STATUS_COMPLETED:
        raise SwapRuleError("Reviews can only be submitted after the swap is completed.")

    if user.pk not in (swap.requester_id, swap.provider_id):
        raise SwapPermissionError("Only participants in this swap can leave a review.")

    recipient = swap.provider if user.pk == swap.requester_id else swap.requester

    try:
        score = int(score)
    except (TypeError, ValueError):
        raise SwapRuleError("Score must be an integer between 1 and 5.")

    if score < 1 or score > 5:
        raise SwapRuleError("Score must be between 1 and 5.")

    if Review.objects.filter(swap=swap, author=user).exists():
        raise SwapRuleError("You have already reviewed this swap.", status_code=409)

    review = Review.objects.create(
        swap=swap,
        author=user,
        recipient=recipient,
        score=score,
        text=(text or "").strip(),
    )

    Notification.objects.create(
        user=recipient,
        title=f"{score}-star review received",
        body=f"{user.full_name or user.display_handle} left you a review for '{swap.service_title}'.",
        link=f"swaps/{swap.id}",
    )

    return review


@transaction.atomic
def send_message(user, swap_id, body):
    """
    Sends a chat message in the swap thread.
    Updates sender read timestamp.
    """
    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)

    if user.pk not in (swap.requester_id, swap.provider_id):
        raise SwapPermissionError("You are not a participant in this swap.")

    body = (body or "").strip()
    if not body:
        raise SwapRuleError("Message body cannot be empty.")

    now = timezone.now()
    if user.pk == swap.requester_id:
        swap.requester_read_at = now
        recipient = swap.provider
    else:
        swap.provider_read_at = now
        recipient = swap.requester
    swap.save(update_fields=["requester_read_at", "provider_read_at"])

    msg = Message.objects.create(
        swap=swap,
        sender=user,
        body=body,
        is_system=False,
    )

    Notification.objects.create(
        user=recipient,
        title=f"New message from {user.full_name or user.display_handle}",
        body=body[:100],
        link=f"swaps/{swap.id}",
    )

    return msg


@transaction.atomic
def admin_release_credits(swap_id, admin_user=None):
    """
    Django Admin action: releases credits to provider for stuck swaps.
    """
    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)

    if swap.status == SwapRequest.STATUS_COMPLETED:
        return swap

    provider = User.objects.select_for_update().get(pk=swap.provider_id)
    now = timezone.now()

    swap.status = SwapRequest.STATUS_COMPLETED
    swap.completed_at = now
    swap.save(update_fields=["status", "completed_at", "updated_at"])

    LedgerEntry.objects.create(
        user=provider,
        swap=swap,
        type=LedgerEntry.TYPE_EARN,
        amount=swap.credit_amount,
        description=f"Admin release: credits earned for swap '{swap.service_title}'",
    )

    Message.objects.create(
        swap=swap,
        sender=None,
        body=f"Administrative action: {swap.credit_amount} Swap Credits released to provider by admin.",
        is_system=True,
    )

    Notification.objects.create(
        user=provider,
        title="Admin released credits",
        body=f"Swap '{swap.service_title}' was resolved by admin. {swap.credit_amount} credits credited.",
        link=f"swaps/{swap.id}",
    )

    return swap


@transaction.atomic
def admin_refund_requester(swap_id, admin_user=None):
    """
    Django Admin action: refunds credits to requester for stuck swaps.
    """
    swap = SwapRequest.objects.select_for_update().get(pk=swap_id)
    requester = User.objects.select_for_update().get(pk=swap.requester_id)

    if swap.status in (SwapRequest.STATUS_CANCELLED, SwapRequest.STATUS_DECLINED):
        return swap

    swap.status = SwapRequest.STATUS_CANCELLED
    swap.save(update_fields=["status", "updated_at"])

    LedgerEntry.objects.create(
        user=requester,
        swap=swap,
        type=LedgerEntry.TYPE_REFUND,
        amount=swap.credit_amount,
        description=f"Admin refund: {swap.credit_amount} credits refunded for '{swap.service_title}'",
    )

    Message.objects.create(
        swap=swap,
        sender=None,
        body=f"Administrative action: {swap.credit_amount} Swap Credits refunded to requester by admin.",
        is_system=True,
    )

    Notification.objects.create(
        user=requester,
        title="Admin refunded credits",
        body=f"Swap '{swap.service_title}' was refunded by admin. {swap.credit_amount} credits restored.",
        link=f"swaps/{swap.id}",
    )

    return swap
