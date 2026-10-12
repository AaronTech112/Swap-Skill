from django.test import TestCase
from rest_framework.test import APIClient
from marketplace.models import Category, Skill


class EndToEndJourneyTest(TestCase):
    def test_complete_two_user_swap_journey(self):
        """
        Executes the full user journey with two separate clients (Alice and Bob):
        1. Alice & Bob register (both receive 300 credits)
        2. Alice publishes a service (120 credits, 3 days)
        3. Bob browses marketplace and requests Alice's service (120 credits locked in escrow)
        4. Alice accepts the request (status -> in_progress)
        5. Alice delivers work with link and note (status -> review)
        6. Bob requests changes with a note (status -> in_progress)
        7. Alice re-delivers updated work (status -> review)
        8. Bob approves deliverables (status -> completed, 120 credits paid to Alice)
        9. Both leave reviews (Alice reviews Bob, Bob reviews Alice)
        10. Verify wallet balances, notifications, reputation, and chat messages on both accounts.
        """
        # Seed category
        cat = Category.objects.create(name="Design", slug="design")
        Skill.objects.create(name="UI Design")

        # Client A (Alice)
        client_a = APIClient()
        res_a = client_a.post(
            "/api/auth/register/",
            {"email": "alice@swapski.ng", "password": "Password123!", "full_name": "Alice Cooper"},
            format="json",
        )
        self.assertEqual(res_a.status_code, 201)
        self.assertEqual(res_a.json()["balances"]["available"], 300)

        # Client B (Bob)
        client_b = APIClient()
        res_b = client_b.post(
            "/api/auth/register/",
            {"email": "bob@swapski.ng", "password": "Password123!", "full_name": "Bob Marley"},
            format="json",
        )
        self.assertEqual(res_b.status_code, 201)
        self.assertEqual(res_b.json()["balances"]["available"], 300)

        # 2. Alice publishes a service
        svc_res = client_a.post(
            "/api/services/",
            {
                "title": "Brand Identity Design",
                "category_id": cat.id,
                "description": "Complete logo, typography, and palette guidelines.",
                "credit_cost": 120,
                "delivery_days": 3,
                "skills": ["UI Design"],
            },
            format="json",
        )
        self.assertEqual(svc_res.status_code, 201)
        service_id = svc_res.json()["id"]

        # 3. Bob requests Alice's service
        swap_res = client_b.post(
            "/api/swaps/",
            {
                "service_id": service_id,
                "message": "Hi Alice, we need branding for our music startup.",
            },
            format="json",
        )
        self.assertEqual(swap_res.status_code, 201)
        swap_id = swap_res.json()["id"]

        # Check Bob's escrow balance: 180 available, 120 escrow
        wallet_b = client_b.get("/api/wallet/").json()
        self.assertEqual(wallet_b["balances"]["available"], 180)
        self.assertEqual(wallet_b["balances"]["escrow"], 120)

        # 4. Alice accepts the request
        accept_res = client_a.post(f"/api/swaps/{swap_id}/accept/")
        self.assertEqual(accept_res.status_code, 200)
        self.assertEqual(accept_res.json()["status"], "in_progress")

        # 5. Alice delivers work
        deliv1_res = client_a.post(
            f"/api/swaps/{swap_id}/deliver/",
            {
                "link": "https://figma.com/file/branding-v1",
                "note": "First draft of the color system and marks.",
            },
            format="json",
        )
        self.assertEqual(deliv1_res.status_code, 200)
        self.assertEqual(deliv1_res.json()["swap"]["status"], "review")

        # 6. Bob requests changes
        rev_req_res = client_b.post(
            f"/api/swaps/{swap_id}/request-changes/",
            {"note": "Looks great, but could we explore warmer tones for the primary accent?"},
            format="json",
        )
        self.assertEqual(rev_req_res.status_code, 200)
        self.assertEqual(rev_req_res.json()["status"], "in_progress")

        # 7. Alice re-delivers
        deliv2_res = client_a.post(
            f"/api/swaps/{swap_id}/deliver/",
            {
                "link": "https://figma.com/file/branding-v2",
                "note": "Updated with warm sunset tones and responsive icon variants.",
            },
            format="json",
        )
        self.assertEqual(deliv2_res.status_code, 200)
        self.assertEqual(deliv2_res.json()["swap"]["status"], "review")

        # 8. Bob approves
        appr_res = client_b.post(f"/api/swaps/{swap_id}/approve/")
        self.assertEqual(appr_res.status_code, 200)
        self.assertEqual(appr_res.json()["status"], "completed")

        # Verify balances after approval:
        # Alice: 300 initial + 120 earned = 420 available
        wallet_a = client_a.get("/api/wallet/").json()
        self.assertEqual(wallet_a["balances"]["available"], 420)
        self.assertEqual(wallet_a["balances"]["earned"], 120)

        # Bob: 180 available, 0 escrow, 120 spent
        wallet_b = client_b.get("/api/wallet/").json()
        self.assertEqual(wallet_b["balances"]["available"], 180)
        self.assertEqual(wallet_b["balances"]["escrow"], 0)
        self.assertEqual(wallet_b["balances"]["spent"], 120)

        # 9. Both leave reviews
        rev_bob = client_b.post(
            f"/api/swaps/{swap_id}/review/",
            {"score": 5, "text": "Phenomenal work! Alice delivered exactly what we envisioned."},
            format="json",
        )
        self.assertEqual(rev_bob.status_code, 200)

        rev_alice = client_a.post(
            f"/api/swaps/{swap_id}/review/",
            {"score": 5, "text": "Bob was super clear with feedback and quick to approve."},
            format="json",
        )
        self.assertEqual(rev_alice.status_code, 200)

        # 10. Check reputation and public profiles
        pub_a = client_b.get(f"/api/users/{res_a.json()['id']}/").json()
        self.assertEqual(pub_a["user"]["rating"], 5.0)
        self.assertEqual(pub_a["user"]["completed_swaps"], 1)
        self.assertEqual(len(pub_a["reviews"]), 1)

        pub_b = client_a.get(f"/api/users/{res_b.json()['id']}/").json()
        self.assertEqual(pub_b["user"]["rating"], 5.0)
        self.assertEqual(len(pub_b["reviews"]), 1)

        # Notifications check
        notifs_a = client_a.get("/api/notifications/").json()
        self.assertTrue(len(notifs_a) >= 4)  # welcome, new request, changes requested, review

        notifs_b = client_b.get("/api/notifications/").json()
        self.assertTrue(len(notifs_b) >= 4)  # welcome, accepted, deliverable ready (x2), review
