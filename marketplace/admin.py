from django.contrib import admin
from marketplace.models import Category, Skill, Service


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "description"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "owner",
        "category",
        "credit_cost",
        "delivery_days",
        "is_active",
        "created_at",
    ]
    list_filter = ["is_active", "category", "created_at"]
    search_fields = ["title", "description", "owner__email", "owner__handle", "owner__full_name"]
    filter_horizontal = ("skills",)
    ordering = ["-created_at"]
