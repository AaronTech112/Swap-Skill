from django.test import TestCase
from accounts.models import User
from marketplace.models import Category, Service, Skill
from swaps.models import Delivery, LedgerEntry, Review, SwapRequest
from swaps.services import (
    SwapPermissionError,
    SwapRuleError,
    accept_swap,
    approve_swap,
    cancel_swap,
    create_review,
    create_swap,
    decline_swap,
    deliver_swap,
    get_user_balances,
    get_user_reputation,
    register_user,
    request_changes,
)


class SwapBusinessLogicTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Development", slug="development")
        self.skill = Skill.objects.create(name="Python")

        self.user_a = register_user("user_a@test.com", "Password123!", "User A")
        self.user_b = register_user("user_b@test.com", "Password123!", "User B")
        self.user_c = register_user("user_c@test.com", "Password123!", "User C")

        self.service_b = Service.objects.create(
            owner=self.user_b,
            title="API Integration",
            category=self.category,
            description="Build APIs",
            credit_cost=100,
            delivery_days=3,
        )

    def test_signup_bonus_creates_300_credits(self):
        balances = get_user_balances(self.user_a)
        self.assertEqual(balances["available"], 300)
        self.assertEqual(balances["escrow"], 0)
        self.assertEqual(balances["earned"], 0)
        self.assertEqual(balances["spent"], 0)
        self.assertEqual(self.user_a.ledger_entries.count(), 1)
        self.assertEqual(self.user_a.ledger_entries.first().type, LedgerEntry.TYPE_SIGNUP_BONUS)
        self.assertEqual(self.user_a.ledger_entries.first().amount, 300)

    def test_cannot_hire_yourself(self):
        my_service = Service.objects.create(
            owner=self.user_a,
            title="My Own Service",
            category=self.category,
            description="Self",
            credit_cost=50,
            delivery_days=2,
        )
        with self.assertRaises(SwapRuleError) as ctx:
            create_swap(self.user_a, my_service, "Hire myself")
        self.assertIn("cannot request your own service", str(ctx.exception))

    def test_insufficient_credits_rejected(self):
        expensive_service = Service.objects.create(
            owner=self.user_b,
            title="Expensive Build",
            category=self.category,
            description="High cost",
            credit_cost=500,
            delivery_days=5,
        )
        with self.assertRaises(SwapRuleError) as ctx:
            create_swap(self.user_a, expensive_service, "Need expensive service")
        self.assertIn("Insufficient credits", str(ctx.exception))

    def test_request_locks_credits_in_escrow(self):
        swap = create_swap(self.user_a, self.service_b, "Let's build an API")
        self.assertEqual(swap.status, SwapRequest.STATUS_REQUESTED)
        self.assertEqual(swap.credit_amount, 100)

        balances_a = get_user_balances(self.user_a)
        self.assertEqual(balances_a["available"], 200)
        self.assertEqual(balances_a["escrow"], 100)

        # Provider balance unaffected until approval
        balances_b = get_user_balances(self.user_b)
        self.assertEqual(balances_b["available"], 300)

    def test_duplicate_open_request_rejected(self):
        create_swap(self.user_a, self.service_b, "First request")
        with self.assertRaises(SwapRuleError) as ctx:
            create_swap(self.user_a, self.service_b, "Second request")
        self.assertIn("already have an active swap open", str(ctx.exception))

    def test_cancel_swap_refunds_requester(self):
        swap = create_swap(self.user_a, self.service_b, "Request to cancel")
        self.assertEqual(get_user_balances(self.user_a)["available"], 200)

        # Only requester can cancel
        with self.assertRaises(SwapPermissionError):
            cancel_swap(self.user_b, swap.id)

        cancel_swap(self.user_a, swap.id)
        swap.refresh_from_db()
        self.assertEqual(swap.status, SwapRequest.STATUS_CANCELLED)

        balances_a = get_user_balances(self.user_a)
        self.assertEqual(balances_a["available"], 300)
        self.assertEqual(balances_a["escrow"], 0)

    def test_decline_swap_refunds_requester(self):
        swap = create_swap(self.user_a, self.service_b, "Request to decline")

        # Only provider can decline
        with self.assertRaises(SwapPermissionError):
            decline_swap(self.user_a, swap.id)

        decline_swap(self.user_b, swap.id)
        swap.refresh_from_db()
        self.assertEqual(swap.status, SwapRequest.STATUS_DECLINED)

        balances_a = get_user_balances(self.user_a)
        self.assertEqual(balances_a["available"], 300)
        self.assertEqual(balances_a["escrow"], 0)

    def test_full_swap_lifecycle_and_idempotent_approval(self):
        # 1. Request
        swap = create_swap(self.user_a, self.service_b, "Please build the API")
        self.assertEqual(swap.status, SwapRequest.STATUS_REQUESTED)

        # 2. Accept: only provider
        with self.assertRaises(SwapPermissionError):
            accept_swap(self.user_a, swap.id)
        accept_swap(self.user_b, swap.id)
        swap.refresh_from_db()
        self.assertEqual(swap.status, SwapRequest.STATUS_IN_PROGRESS)
        self.assertIsNotNone(swap.accepted_at)
        self.assertIsNotNone(swap.due_at)

        # 3. Deliver: only provider
        with self.assertRaises(SwapPermissionError):
            deliver_swap(self.user_a, swap.id, note="I can't deliver")
        deliver_swap(self.user_b, swap.id, link="https://api.test/docs", note="First version ready")
        swap.refresh_from_db()
        self.assertEqual(swap.status, SwapRequest.STATUS_REVIEW)

        # 4. Request Changes: only requester
        with self.assertRaises(SwapPermissionError):
            request_changes(self.user_b, swap.id, note="Provider requesting changes")
        request_changes(self.user_a, swap.id, note="Please add auth endpoints")
        swap.refresh_from_db()
        self.assertEqual(swap.status, SwapRequest.STATUS_IN_PROGRESS)

        # 5. Redeliver
        deliver_swap(self.user_b, swap.id, link="https://api.test/docs-v2", note="Added auth endpoints")
        swap.refresh_from_db()
        self.assertEqual(swap.status, SwapRequest.STATUS_REVIEW)

        # 6. Approve: only requester
        with self.assertRaises(SwapPermissionError):
            approve_swap(self.user_b, swap.id)
        approve_swap(self.user_a, swap.id)
        swap.refresh_from_db()
        self.assertEqual(swap.status, SwapRequest.STATUS_COMPLETED)

        # Balances verification
        balances_a = get_user_balances(self.user_a)
        balances_b = get_user_balances(self.user_b)
        self.assertEqual(balances_a["available"], 200)
        self.assertEqual(balances_a["escrow"], 0)
        self.assertEqual(balances_a["spent"], 100)

        self.assertEqual(balances_b["available"], 400)
        self.assertEqual(balances_b["earned"], 100)

        # Idempotence: Call approve_swap second time -> MUST NOT pay provider twice!
        approve_swap(self.user_a, swap.id)
        balances_b_after = get_user_balances(self.user_b)
        self.assertEqual(balances_b_after["available"], 400)
        self.assertEqual(balances_b_after["earned"], 100)
        self.assertEqual(self.user_b.ledger_entries.filter(type=LedgerEntry.TYPE_EARN).count(), 1)

    def test_reviews_one_per_party_and_ratings(self):
        swap = create_swap(self.user_a, self.service_b, "Need help")
        accept_swap(self.user_b, swap.id)
        deliver_swap(self.user_b, swap.id, note="Done")
        approve_swap(self.user_a, swap.id)

        # Third party cannot review
        with self.assertRaises(SwapPermissionError):
            create_review(self.user_c, swap.id, 5, "Nice work")

        # Requester reviews provider
        rev_a = create_review(self.user_a, swap.id, 5, "Outstanding API!")
        self.assertEqual(rev_a.score, 5)
        self.assertEqual(rev_a.recipient, self.user_b)

        # Duplicate review rejected
        with self.assertRaises(SwapRuleError) as ctx:
            create_review(self.user_a, swap.id, 4, "Another review")
        self.assertIn("already reviewed", str(ctx.exception))

        # Provider reviews requester
        rev_b = create_review(self.user_b, swap.id, 4, "Great requester!")
        self.assertEqual(rev_b.recipient, self.user_a)

        rep_b = get_user_reputation(self.user_b)
        self.assertEqual(rep_b["rating"], 5.0)
        self.assertEqual(rep_b["completed_swaps"], 1)

        rep_a = get_user_reputation(self.user_a)
        self.assertEqual(rep_a["rating"], 4.0)

    def test_service_deactivation_with_existing_swaps(self):
        swap = create_swap(self.user_a, self.service_b, "Active swap")
        self.service_b.is_active = False
        self.service_b.save()

        # Existing swap proceeds normally
        accept_swap(self.user_b, swap.id)
        swap.refresh_from_db()
        self.assertEqual(swap.status, SwapRequest.STATUS_IN_PROGRESS)

        # New requests to deactivated service are rejected
        with self.assertRaises(SwapRuleError) as ctx:
            create_swap(self.user_c, self.service_b, "New request to deactivated")
        self.assertIn("no longer active", str(ctx.exception))
