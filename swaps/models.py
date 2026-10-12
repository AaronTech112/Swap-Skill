from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class SwapRequest(models.Model):
    STATUS_REQUESTED = "requested"
    STATUS_IN_PROGRESS = "in_progress"
    STATUS_REVIEW = "review"
    STATUS_COMPLETED = "completed"
    STATUS_DECLINED = "declined"
    STATUS_CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (STATUS_REQUESTED, "Requested"),
        (STATUS_IN_PROGRESS, "In Progress"),
        (STATUS_REVIEW, "Under Review"),
        (STATUS_COMPLETED, "Completed"),
        (STATUS_DECLINED, "Declined"),
        (STATUS_CANCELLED, "Cancelled"),
    ]

    requester = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="requested_swaps"
    )
    provider = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="provided_swaps"
    )
    service = models.ForeignKey(
        "marketplace.Service",
        on_delete=models.PROTECT,
        related_name="swaps"
    )
    service_title = models.CharField(max_length=120)
    credit_amount = models.PositiveIntegerField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_REQUESTED,
        db_index=True
    )
    accepted_at = models.DateTimeField(null=True, blank=True)
    due_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    requester_read_at = models.DateTimeField(null=True, blank=True)
    provider_read_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=~models.Q(requester=models.F("provider")),
                name="swap_requester_not_provider"
            ),
            models.CheckConstraint(
                condition=models.Q(credit_amount__gt=0),
                name="swap_credit_amount_positive"
            ),
        ]
        indexes = [
            models.Index(fields=["requester", "status"]),
            models.Index(fields=["provider", "status"]),
        ]

    def clean(self):
        if self.requester_id and self.provider_id and self.requester_id == self.provider_id:
            raise ValidationError("Requester cannot be the provider of a swap.")

    def __str__(self):
        return f"Swap #{self.pk}: '{self.service_title}' ({self.get_status_display()})"


class Delivery(models.Model):
    swap = models.ForeignKey(
        SwapRequest,
        on_delete=models.CASCADE,
        related_name="deliveries"
    )
    link = models.URLField(max_length=500, blank=True)
    note = models.TextField(blank=True)
    file = models.FileField(upload_to="deliveries/%Y/%m/", blank=True, null=True)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="deliveries"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def clean(self):
        if not self.link and not self.note and not self.file:
            raise ValidationError("Delivery must contain at least a link, note, or file.")

    def __str__(self):
        return f"Delivery for Swap #{self.swap_id} by {self.created_by.display_handle}"


class LedgerEntry(models.Model):
    TYPE_SIGNUP_BONUS = "SIGNUP_BONUS"
    TYPE_ESCROW_LOCK = "ESCROW_LOCK"
    TYPE_EARN = "EARN"
    TYPE_REFUND = "REFUND"

    TYPE_CHOICES = [
        (TYPE_SIGNUP_BONUS, "Signup Bonus"),
        (TYPE_ESCROW_LOCK, "Escrow Lock"),
        (TYPE_EARN, "Earn"),
        (TYPE_REFUND, "Refund"),
    ]

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="ledger_entries"
    )
    swap = models.ForeignKey(
        SwapRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries"
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, db_index=True)
    amount = models.IntegerField(help_text="Signed integer: positive for credit in, negative for lock/deduction")
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["user", "type"]),
        ]

    def __str__(self):
        sign = "+" if self.amount > 0 else ""
        return f"{self.user.display_handle} {sign}{self.amount} cr ({self.type}) - {self.description}"


class Message(models.Model):
    swap = models.ForeignKey(
        SwapRequest,
        on_delete=models.CASCADE,
        related_name="messages"
    )
    sender = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_messages"
    )
    body = models.TextField()
    is_system = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["swap", "created_at"]),
        ]

    def __str__(self):
        sender_str = "System" if self.is_system or not self.sender else self.sender.display_handle
        return f"[{self.swap_id}] {sender_str}: {self.body[:40]}"


class Review(models.Model):
    swap = models.ForeignKey(
        SwapRequest,
        on_delete=models.CASCADE,
        related_name="reviews"
    )
    author = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="authored_reviews"
    )
    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="received_reviews"
    )
    score = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["swap", "author"],
                name="unique_swap_author_review"
            ),
            models.CheckConstraint(
                condition=models.Q(score__gte=1, score__lte=5),
                name="review_score_range_1_to_5"
            ),
        ]
        indexes = [
            models.Index(fields=["recipient", "score"]),
        ]

    def __str__(self):
        return f"Review by {self.author.display_handle} for {self.recipient.display_handle} ({self.score}★)"


class Notification(models.Model):
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="notifications"
    )
    title = models.CharField(max_length=120)
    body = models.TextField()
    link = models.CharField(
        max_length=120,
        blank=True,
        help_text="Route path, e.g. swaps/12"
    )
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "read_at"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self):
        return f"Notification to {self.user.display_handle}: {self.title}"
