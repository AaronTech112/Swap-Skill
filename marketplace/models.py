import re
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(max_length=60, unique=True)
    description = models.CharField(max_length=200, blank=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


def normalize_skill_name(raw):
    if not raw:
        return ""
    words = " ".join(raw.split()).split()
    norm = []
    for w in words:
        if "-" in w:
            parts = [p.capitalize() for p in w.split("-")]
            norm.append("-".join(parts))
        elif w.isupper() and len(w) <= 4:
            norm.append(w)
        elif w.lower() in ("apis", "api"):
            norm.append("APIs" if w.lower() == "apis" else "API")
        elif w.lower() in ("ui", "ux", "seo"):
            norm.append(w.upper())
        else:
            norm.append(w.capitalize())
    return " ".join(norm)


class Skill(models.Model):
    name = models.CharField(max_length=40, unique=True)

    class Meta:
        ordering = ["name"]

    def clean(self):
        if self.name:
            self.name = normalize_skill_name(self.name)

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Service(models.Model):
    owner = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="services"
    )
    title = models.CharField(max_length=120)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="services"
    )
    description = models.TextField()
    credit_cost = models.PositiveIntegerField(
        help_text="Cost in Swap Credits (10-1000)"
    )
    delivery_days = models.PositiveSmallIntegerField(
        help_text="Delivery time in days (1-30)"
    )
    skills = models.ManyToManyField(
        Skill,
        related_name="services",
        blank=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(credit_cost__gte=10, credit_cost__lte=1000),
                name="service_credit_cost_range"
            ),
            models.CheckConstraint(
                condition=models.Q(delivery_days__gte=1, delivery_days__lte=30),
                name="service_delivery_days_range"
            ),
        ]

    def __str__(self):
        return f"{self.title} ({self.credit_cost} cr) - @{self.owner.handle}"
