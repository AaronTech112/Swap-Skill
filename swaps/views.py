from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from marketplace.models import Service
from marketplace.serializers import ServiceSerializer
from swaps.models import Delivery, LedgerEntry, Message, Notification, SwapRequest
from swaps.serializers import (
    DeliverySerializer,
    LedgerEntrySerializer,
    MessageSerializer,
    NotificationSerializer,
    SwapDetailSerializer,
    SwapListSerializer,
)
from swaps.services import (
    accept_swap,
    approve_swap,
    cancel_swap,
    create_review,
    create_swap,
    decline_swap,
    deliver_swap,
    get_user_balances,
    request_changes,
    send_message,
)


class SwapListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.query_params.get("role", "").strip()
        status_param = request.query_params.get("status", "").strip()

        qs = SwapRequest.objects.select_related("requester", "provider", "service").prefetch_related("messages")
        if role == "requester":
            qs = qs.filter(requester=request.user)
        elif role == "provider":
            qs = qs.filter(provider=request.user)
        else:
            qs = qs.filter(requester=request.user) | qs.filter(provider=request.user)
            qs = qs.distinct()

        if status_param and status_param.lower() != "all":
            qs = qs.filter(status=status_param)

        qs = qs.order_by("-created_at")
        serializer = SwapListSerializer(qs, many=True, context={"user": request.user})
        return Response(serializer.data)

    def post(self, request):
        service_id = request.data.get("service_id")
        message = request.data.get("message", "")

        if not service_id:
            return Response({"detail": "service_id is required.", "errors": {}}, status=status.HTTP_400_BAD_REQUEST)

        service = get_object_or_404(Service, pk=service_id)
        swap = create_swap(request.user, service, message)
        serializer = SwapDetailSerializer(swap, context={"user": request.user})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SwapDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        swap = get_object_or_404(
            SwapRequest.objects.select_related("requester", "provider", "service")
            .prefetch_related("deliveries__created_by", "ledger_entries", "reviews__author", "messages"),
            pk=pk,
        )
        if request.user.pk not in (swap.requester_id, swap.provider_id):
            raise Http404("Swap not found.")

        serializer = SwapDetailSerializer(swap, context={"user": request.user})
        return Response(serializer.data)


class SwapAcceptView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        swap = accept_swap(request.user, pk)
        return Response(SwapDetailSerializer(swap, context={"user": request.user}).data)


class SwapDeclineView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        swap = decline_swap(request.user, pk)
        return Response(SwapDetailSerializer(swap, context={"user": request.user}).data)


class SwapCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        swap = cancel_swap(request.user, pk)
        return Response(SwapDetailSerializer(swap, context={"user": request.user}).data)


class SwapDeliverView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        link = request.data.get("link", "")
        note = request.data.get("note", "")
        file = request.FILES.get("file", None)

        delivery = deliver_swap(request.user, pk, link=link, note=note, file=file)
        swap = SwapRequest.objects.get(pk=pk)
        return Response({
            "delivery": DeliverySerializer(delivery).data,
            "swap": SwapDetailSerializer(swap, context={"user": request.user}).data,
        })


class SwapApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        swap = approve_swap(request.user, pk)
        return Response(SwapDetailSerializer(swap, context={"user": request.user}).data)


class SwapRequestChangesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        note = request.data.get("note", "")
        swap = request_changes(request.user, pk, note)
        return Response(SwapDetailSerializer(swap, context={"user": request.user}).data)


class SwapReviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        score = request.data.get("score")
        text = request.data.get("text", "")
        review = create_review(request.user, pk, score=score, text=text)
        swap = SwapRequest.objects.get(pk=pk)
        return Response({
            "review": {
                "id": review.id,
                "score": review.score,
                "text": review.text,
                "created_at": review.created_at,
            },
            "swap": SwapDetailSerializer(swap, context={"user": request.user}).data,
        })


class SwapMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        swap = get_object_or_404(SwapRequest, pk=pk)
        if request.user.pk not in (swap.requester_id, swap.provider_id):
            raise Http404("Swap not found.")

        # Update reader timestamp
        now = timezone.now()
        if request.user.pk == swap.requester_id:
            swap.requester_read_at = now
            swap.save(update_fields=["requester_read_at"])
        else:
            swap.provider_read_at = now
            swap.save(update_fields=["provider_read_at"])

        after_id = request.query_params.get("after")
        qs = swap.messages.select_related("sender").order_by("created_at")
        if after_id:
            try:
                qs = qs.filter(id__gt=int(after_id))
            except (ValueError, TypeError):
                pass

        return Response(MessageSerializer(qs, many=True).data)

    def post(self, request, pk):
        body = request.data.get("body", "")
        msg = send_message(request.user, pk, body)
        return Response(MessageSerializer(msg).data, status=status.HTTP_201_CREATED)


class DeliveryDownloadView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        delivery = get_object_or_404(Delivery.objects.select_related("swap"), pk=pk)
        swap = delivery.swap
        if request.user.pk not in (swap.requester_id, swap.provider_id):
            raise Http404("Not found.")

        if not delivery.file:
            raise Http404("No file attached to this delivery.")

        return FileResponse(delivery.file.open("rb"), as_attachment=True, filename=delivery.file.name.split("/")[-1])


class WalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        balances = get_user_balances(request.user)
        entries = LedgerEntry.objects.filter(user=request.user).order_by("-created_at")[:50]
        return Response({
            "balances": balances,
            "entries": LedgerEntrySerializer(entries, many=True).data,
        })


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        notifications = Notification.objects.filter(user=request.user).order_by("-created_at")[:50]
        return Response(NotificationSerializer(notifications, many=True).data)


class NotificationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        notif = get_object_or_404(Notification, pk=pk, user=request.user)
        if not notif.read_at:
            notif.read_at = timezone.now()
            notif.save(update_fields=["read_at"])
        return Response(NotificationSerializer(notif).data)


class NotificationReadAllView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        count = Notification.objects.filter(user=request.user, read_at__isnull=True).update(read_at=timezone.now())
        return Response({"detail": f"Marked {count} notifications as read."})


class StatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "members": User.objects.filter(is_active=True).count(),
            "completed_swaps": SwapRequest.objects.filter(status=SwapRequest.STATUS_COMPLETED).count(),
            "active_services": Service.objects.filter(is_active=True).count(),
        })


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        balances = get_user_balances(user)

        # Needs action:
        # 1. Incoming requests waiting for my acceptance (as provider)
        # 2. Deliveries waiting for my review (as requester)
        incoming_requests = SwapRequest.objects.filter(
            provider=user, status=SwapRequest.STATUS_REQUESTED
        ).order_by("-created_at")
        review_deliveries = SwapRequest.objects.filter(
            requester=user, status=SwapRequest.STATUS_REVIEW
        ).order_by("-created_at")

        needs_action = []
        for req in incoming_requests:
            needs_action.append({
                "type": "incoming_request",
                "swap_id": req.id,
                "title": req.service_title,
                "partner_name": req.requester.full_name or req.requester.display_handle,
                "credits": req.credit_amount,
                "created_at": req.created_at,
            })
        for rev in review_deliveries:
            needs_action.append({
                "type": "review_ready",
                "swap_id": rev.id,
                "title": rev.service_title,
                "partner_name": rev.provider.full_name or rev.provider.display_handle,
                "credits": rev.credit_amount,
                "created_at": rev.created_at,
            })

        # Recent notifications
        recent_notifications = Notification.objects.filter(user=user).order_by("-created_at")[:5]

        # Recommended services: active services from others matching skills_wanted
        wanted_skills = user.skills_wanted.all()
        rec_qs = Service.objects.filter(is_active=True).exclude(owner=user).select_related("owner", "category")
        if wanted_skills.exists():
            matched = rec_qs.filter(skills__in=wanted_skills).distinct()
            if matched.count() >= 3:
                recommended = matched.order_by("-created_at")[:6]
            else:
                recommended = rec_qs.order_by("-created_at")[:6]
        else:
            recommended = rec_qs.order_by("-created_at")[:6]

        return Response({
            "balances": balances,
            "needs_action": needs_action,
            "recent_notifications": NotificationSerializer(recent_notifications, many=True).data,
            "recommended_services": ServiceSerializer(recommended, many=True).data,
        })
