import re
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        extra_fields.setdefault("username", email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    # Unique email as primary login field
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=150, blank=True)
    headline = models.CharField(max_length=255, blank=True)
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=120, blank=True)
    handle = models.CharField(max_length=60, unique=True, blank=True)

    skills_offered = models.ManyToManyField(
        "marketplace.Skill",
        related_name="offered_by_users",
        blank=True
    )
    skills_wanted = models.ManyToManyField(
        "marketplace.Skill",
        related_name="wanted_by_users",
        blank=True
    )

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["-date_joined"]

    def _generate_unique_handle(self):
        base = ""
        if self.full_name:
            base = re.sub(r"[^a-zA-Z0-9]", "", self.full_name).lower()
        if not base and self.email:
            base = re.sub(r"[^a-zA-Z0-9]", "", self.email.split("@")[0]).lower()
        if not base:
            base = "member"

        candidate = base[:40]
        counter = 1
        UserClass = self.__class__
        while UserClass.objects.filter(handle__iexact=candidate).exclude(pk=self.pk).exists():
            candidate = f"{base[:35]}{counter}"
            counter += 1
        return candidate

    def save(self, *args, **kwargs):
        if not self.username:
            self.username = self.email
        if not self.handle:
            self.handle = self._generate_unique_handle()
        super().save(*args, **kwargs)

    @property
    def display_handle(self):
        return f"@{self.handle}"

    def __str__(self):
        return f"{self.full_name or self.email} (@{self.handle})"
