from django.contrib import admin, messages
from swaps.models import Delivery, LedgerEntry, Message, Notification, Review, SwapRequest
from swaps.services import admin_refund_requester, admin_release_credits


@admin.action(description="Release credits to provider (Admin Resolution)")
def release_credits_action(modeladmin, request, queryset):
    count = 0
    for swap in queryset:
        if swap.status in (SwapRequest.STATUS_REQUESTED, SwapRequest.STATUS_IN_PROGRESS, SwapRequest.STATUS_REVIEW):
            admin_release_credits(swap.id, admin_user=request.user)
            count += 1
    messages.success(request, f"Released credits for {count} swap(s).")


@admin.action(description="Refund requester (Admin Resolution)")
def refund_requester_action(modeladmin, request, queryset):
    count = 0
    for swap in queryset:
        if swap.status in (SwapRequest.STATUS_REQUESTED, SwapRequest.STATUS_IN_PROGRESS, SwapRequest.STATUS_REVIEW):
            admin_refund_requester(swap.id, admin_user=request.user)
            count += 1
    messages.success(request, f"Refunded credits for {count} swap(s).")


@admin.register(SwapRequest)
class SwapRequestAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "service_title",
        "requester",
        "provider",
        "credit_amount",
        "status",
        "created_at",
        "due_at",
    ]
    list_filter = ["status", "created_at"]
    search_fields = [
        "service_title",
        "requester__email",
        "requester__handle",
        "provider__email",
        "provider__handle",
    ]
    actions = [release_credits_action, refund_requester_action]
    ordering = ["-created_at"]


@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "user",
        "type",
        "amount",
        "swap",
        "description",
        "created_at",
    ]
    list_filter = ["type", "created_at"]
    search_fields = ["user__email", "user__handle", "description"]
    ordering = ["-created_at"]

    # Ledger is strictly append-only: read-only in admin
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ["id", "swap", "created_by", "link", "created_at"]
    search_fields = ["swap__service_title", "created_by__email", "note", "link"]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["id", "swap", "sender", "is_system", "created_at"]
    list_filter = ["is_system", "created_at"]
    search_fields = ["swap__service_title", "sender__email", "body"]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ["id", "swap", "author", "recipient", "score", "created_at"]
    list_filter = ["score", "created_at"]
    search_fields = ["author__email", "recipient__email", "text"]


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "title", "read_at", "created_at"]
    list_filter = ["read_at", "created_at"]
    search_fields = ["user__email", "title", "body"]
