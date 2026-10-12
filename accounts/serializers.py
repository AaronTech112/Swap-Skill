from rest_framework import serializers
from accounts.models import User
from marketplace.models import Service, Skill
from swaps.services import get_user_balances, get_user_reputation


class SkillListField(serializers.ListField):
    child = serializers.CharField(max_length=40)

    def to_representation(self, data):
        return [item.name for item in data.all()]


class UserPublicSerializer(serializers.ModelSerializer):
    skills_offered = SkillListField(read_only=True)
    skills_wanted = SkillListField(read_only=True)
    rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    completed_swaps = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "handle",
            "headline",
            "bio",
            "location",
            "skills_offered",
            "skills_wanted",
            "rating",
            "review_count",
            "completed_swaps",
            "date_joined",
        ]

    def get_rating(self, obj):
        return get_user_reputation(obj)["rating"]

    def get_review_count(self, obj):
        return get_user_reputation(obj)["review_count"]

    def get_completed_swaps(self, obj):
        return get_user_reputation(obj)["completed_swaps"]


class UserPrivateSerializer(serializers.ModelSerializer):
    skills_offered = SkillListField(required=False)
    skills_wanted = SkillListField(required=False)
    balances = serializers.SerializerMethodField()
    reputation = serializers.SerializerMethodField()
    unread_notifications = serializers.SerializerMethodField()
    unread_messages = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "handle",
            "headline",
            "bio",
            "location",
            "skills_offered",
            "skills_wanted",
            "balances",
            "reputation",
            "unread_notifications",
            "unread_messages",
            "date_joined",
        ]
        read_only_fields = ["id", "email", "handle", "date_joined"]

    def get_balances(self, obj):
        return get_user_balances(obj)

    def get_reputation(self, obj):
        return get_user_reputation(obj)

    def get_unread_notifications(self, obj):
        return obj.notifications.filter(read_at__isnull=True).count()

    def get_unread_messages(self, obj):
        count = 0
        from swaps.models import SwapRequest
        swaps = SwapRequest.objects.filter(
            models_Q_helper(obj)
        )
        for swap in swaps:
            if swap.requester_id == obj.pk:
                last_read = swap.requester_read_at
            else:
                last_read = swap.provider_read_at
            qs = swap.messages.exclude(sender=obj)
            if last_read:
                qs = qs.filter(created_at__gt=last_read)
            count += qs.count()
        return count


def models_Q_helper(user):
    from django.db.models import Q
    return Q(requester=user) | Q(provider=user)
