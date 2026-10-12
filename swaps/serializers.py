from rest_framework import serializers
from swaps.models import Delivery, LedgerEntry, Message, Notification, Review, SwapRequest
from accounts.models import User


class SwapParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "full_name", "handle"]


class DeliverySerializer(serializers.ModelSerializer):
    created_by = SwapParticipantSerializer(read_only=True)
    has_file = serializers.SerializerMethodField()
    file_name = serializers.SerializerMethodField()

    class Meta:
        model = Delivery
        fields = ["id", "link", "note", "has_file", "file_name", "created_by", "created_at"]

    def get_has_file(self, obj):
        return bool(obj.file)

    def get_file_name(self, obj):
        if obj.file:
            return obj.file.name.split("/")[-1]
        return None


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ["id", "type", "amount", "description", "created_at"]


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_handle = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = ["id", "sender", "sender_name", "sender_handle", "body", "is_system", "created_at"]

    def get_sender_name(self, obj):
        if obj.is_system or not obj.sender:
            return "Swapski"
        return obj.sender.full_name or obj.sender.display_handle

    def get_sender_handle(self, obj):
        if obj.is_system or not obj.sender:
            return "system"
        return obj.sender.display_handle


class SwapListSerializer(serializers.ModelSerializer):
    requester = SwapParticipantSerializer(read_only=True)
    provider = SwapParticipantSerializer(read_only=True)
    unread_messages = serializers.SerializerMethodField()

    class Meta:
        model = SwapRequest
        fields = [
            "id",
            "service_id",
            "service_title",
            "credit_amount",
            "status",
            "requester",
            "provider",
            "unread_messages",
            "created_at",
            "due_at",
            "completed_at",
        ]

    def get_unread_messages(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return 0
        if obj.requester_id == user.pk:
            last_read = obj.requester_read_at
        else:
            last_read = obj.provider_read_at
        qs = obj.messages.exclude(sender=user)
        if last_read:
            qs = qs.filter(created_at__gt=last_read)
        return qs.count()


class SwapDetailSerializer(serializers.ModelSerializer):
    requester = SwapParticipantSerializer(read_only=True)
    provider = SwapParticipantSerializer(read_only=True)
    deliveries = DeliverySerializer(many=True, read_only=True)
    ledger_lines = LedgerEntrySerializer(source="ledger_entries", many=True, read_only=True)
    available_actions = serializers.SerializerMethodField()
    unread_messages = serializers.SerializerMethodField()
    user_review = serializers.SerializerMethodField()
    partner_review = serializers.SerializerMethodField()

    class Meta:
        model = SwapRequest
        fields = [
            "id",
            "service_id",
            "service_title",
            "credit_amount",
            "status",
            "requester",
            "provider",
            "deliveries",
            "ledger_lines",
            "available_actions",
            "unread_messages",
            "user_review",
            "partner_review",
            "created_at",
            "accepted_at",
            "due_at",
            "completed_at",
        ]

    def get_available_actions(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return []

        actions = []
        is_req = obj.requester_id == user.pk
        is_prov = obj.provider_id == user.pk

        if is_req:
            if obj.status == SwapRequest.STATUS_REQUESTED:
                actions.append("cancel")
            elif obj.status == SwapRequest.STATUS_REVIEW:
                actions.extend(["approve", "request_changes"])
            elif obj.status == SwapRequest.STATUS_COMPLETED:
                if not obj.reviews.filter(author=user).exists():
                    actions.append("review")

        if is_prov:
            if obj.status == SwapRequest.STATUS_REQUESTED:
                actions.extend(["accept", "decline"])
            elif obj.status == SwapRequest.STATUS_IN_PROGRESS:
                actions.append("deliver")
            elif obj.status == SwapRequest.STATUS_COMPLETED:
                if not obj.reviews.filter(author=user).exists():
                    actions.append("review")

        return actions

    def get_unread_messages(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return 0
        if obj.requester_id == user.pk:
            last_read = obj.requester_read_at
        else:
            last_read = obj.provider_read_at
        qs = obj.messages.exclude(sender=user)
        if last_read:
            qs = qs.filter(created_at__gt=last_read)
        return qs.count()

    def get_user_review(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return None
        rev = obj.reviews.filter(author=user).first()
        if rev:
            return {"score": rev.score, "text": rev.text, "created_at": rev.created_at}
        return None

    def get_partner_review(self, obj):
        user = self.context.get("user")
        if not user or not user.is_authenticated:
            return None
        rev = obj.reviews.exclude(author=user).first()
        if rev:
            return {
                "score": rev.score,
                "text": rev.text,
                "author_name": rev.author.full_name or rev.author.display_handle,
                "created_at": rev.created_at,
            }
        return None


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "title", "body", "link", "read_at", "created_at"]
