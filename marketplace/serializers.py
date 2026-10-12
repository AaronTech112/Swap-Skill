from rest_framework import serializers
from marketplace.models import Category, Service, Skill, normalize_skill_name
from accounts.models import User
from swaps.services import get_user_reputation


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description"]


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ["id", "name"]


class ServiceOwnerSerializer(serializers.ModelSerializer):
    rating = serializers.SerializerMethodField()
    completed_swaps = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "full_name", "handle", "headline", "location", "rating", "completed_swaps"]

    def get_rating(self, obj):
        return get_user_reputation(obj)["rating"]

    def get_completed_swaps(self, obj):
        return get_user_reputation(obj)["completed_swaps"]


class ServiceSerializer(serializers.ModelSerializer):
    owner = ServiceOwnerSerializer(read_only=True)
    category = serializers.SlugRelatedField(
        slug_field="name",
        queryset=Category.objects.all()
    )
    skills = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id",
            "owner",
            "title",
            "category",
            "description",
            "credit_cost",
            "delivery_days",
            "skills",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "owner", "created_at"]

    def get_skills(self, obj):
        return [s.name for s in obj.skills.all()]


class ServiceWriteSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category"
    )
    skills = serializers.ListField(
        child=serializers.CharField(max_length=40),
        required=False
    )

    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "category_id",
            "description",
            "credit_cost",
            "delivery_days",
            "skills",
            "is_active",
        ]

    def validate_title(self, value):
        val = value.strip()
        if len(val) < 5:
            raise serializers.ValidationError("Title must be at least 5 characters.")
        return val

    def validate_credit_cost(self, value):
        if value < 10 or value > 1000:
            raise serializers.ValidationError("Credit cost must be between 10 and 1,000 credits.")
        return value

    def validate_delivery_days(self, value):
        if value < 1 or value > 30:
            raise serializers.ValidationError("Delivery days must be between 1 and 30 days.")
        return value

    def validate_skills(self, value):
        if len(value) > 5:
            raise serializers.ValidationError("A maximum of 5 skills can be linked.")
        return value

    def create(self, validated_data):
        skills_raw = validated_data.pop("skills", [])
        service = Service.objects.create(**validated_data)
        skill_objs = []
        for name in skills_raw:
            norm = normalize_skill_name(name)
            if norm:
                s, _ = Skill.objects.get_or_create(name=norm)
                skill_objs.append(s)
        service.skills.set(skill_objs)
        return service

    def update(self, instance, validated_data):
        skills_raw = validated_data.pop("skills", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if skills_raw is not None:
            skill_objs = []
            for name in skills_raw:
                norm = normalize_skill_name(name)
                if norm:
                    s, _ = Skill.objects.get_or_create(name=norm)
                    skill_objs.append(s)
            instance.skills.set(skill_objs)
        return instance
