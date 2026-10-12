import json
from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from marketplace.models import Category, Service, Skill
from swaps.models import SwapRequest


class AccountsAndAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.category = Category.objects.create(name="Development", slug="development")
        self.skill = Skill.objects.create(name="UI Design")

    def test_register_creates_account_and_session(self):
        res = self.client.post(
            "/api/auth/register/",
            {"email": "newuser@test.com", "password": "Password123!", "full_name": "New User"},
            format="json",
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["email"], "newuser@test.com")
        self.assertEqual(data["balances"]["available"], 300)

        # Session should be authenticated
        me_res = self.client.get("/api/auth/me/")
        self.assertEqual(me_res.status_code, 200)
        self.assertEqual(me_res.json()["email"], "newuser@test.com")

    def test_login_and_logout(self):
        user = User.objects.create_user(email="login@test.com", password="Password123!", full_name="Login Tester")

        # Wrong password
        bad_res = self.client.post(
            "/api/auth/login/",
            {"email": "login@test.com", "password": "WrongPassword"},
            format="json",
        )
        self.assertEqual(bad_res.status_code, 401)

        # Correct password
        ok_res = self.client.post(
            "/api/auth/login/",
            {"email": "login@test.com", "password": "Password123!"},
            format="json",
        )
        self.assertEqual(ok_res.status_code, 200)

        # Logout
        logout_res = self.client.post("/api/auth/logout/")
        self.assertEqual(logout_res.status_code, 200)

        # Unauthenticated me returns 403 or 401
        unauth_me = self.client.get("/api/auth/me/")
        self.assertIn(unauth_me.status_code, (401, 403))

    def test_public_user_profile(self):
        user = User.objects.create_user(email="public@test.com", password="Password123!", full_name="Public Member")
        res = self.client.get(f"/api/users/{user.id}/")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["user"]["full_name"], "Public Member")
        self.assertIn("services", data)
        self.assertIn("reviews", data)

    def test_stats_and_catalogue(self):
        cat_res = self.client.get("/api/categories/")
        self.assertEqual(cat_res.status_code, 200)
        self.assertEqual(len(cat_res.json()), 1)

        stats_res = self.client.get("/api/stats/")
        self.assertEqual(stats_res.status_code, 200)
        self.assertIn("members", stats_res.json())
        self.assertIn("active_services", stats_res.json())

    def test_swap_api_endpoints_and_permissions(self):
        # Register requester and provider
        self.client.post(
            "/api/auth/register/",
            {"email": "requester@test.com", "password": "Password123!", "full_name": "Requester"},
            format="json",
        )
        req_client = APIClient()
        req_client.post(
            "/api/auth/login/",
            {"email": "requester@test.com", "password": "Password123!"},
            format="json",
        )

        prov_client = APIClient()
        prov_client.post(
            "/api/auth/register/",
            {"email": "provider@test.com", "password": "Password123!", "full_name": "Provider"},
            format="json",
        )

        # Provider publishes service
        svc_res = prov_client.post(
            "/api/services/",
            {
                "title": "Django API Service",
                "category_id": self.category.id,
                "description": "High performance APIs",
                "credit_cost": 150,
                "delivery_days": 2,
                "skills": ["UI Design"],
            },
            format="json",
        )
        self.assertEqual(svc_res.status_code, 201)
        service_id = svc_res.json()["id"]

        # Requester requests service
        swap_res = req_client.post(
            "/api/swaps/",
            {"service_id": service_id, "message": "Can you build this for me?"},
            format="json",
        )
        self.assertEqual(swap_res.status_code, 201)
        swap_id = swap_res.json()["id"]

        # Non-participant gets 404
        other_client = APIClient()
        other_client.post(
            "/api/auth/register/",
            {"email": "other@test.com", "password": "Password123!", "full_name": "Other"},
            format="json",
        )
        other_detail = other_client.get(f"/api/swaps/{swap_id}/")
        self.assertEqual(other_detail.status_code, 404)

        # Provider accepts
        accept_res = prov_client.post(f"/api/swaps/{swap_id}/accept/")
        self.assertEqual(accept_res.status_code, 200)
        self.assertEqual(accept_res.json()["status"], "in_progress")

        # Provider delivers
        deliv_res = prov_client.post(
            f"/api/swaps/{swap_id}/deliver/",
            {"link": "https://example.com", "note": "Deliverable complete"},
            format="json",
        )
        self.assertEqual(deliv_res.status_code, 200)

        # Requester approves
        appr_res = req_client.post(f"/api/swaps/{swap_id}/approve/")
        self.assertEqual(appr_res.status_code, 200)
        self.assertEqual(appr_res.json()["status"], "completed")

        # Requester reviews
        rev_res = req_client.post(
            f"/api/swaps/{swap_id}/review/",
            {"score": 5, "text": "Superb work!"},
            format="json",
        )
        self.assertEqual(rev_res.status_code, 200)

        # Wallet balances updated correctly
        req_wallet = req_client.get("/api/wallet/").json()
        self.assertEqual(req_wallet["balances"]["available"], 150)
        self.assertEqual(req_wallet["balances"]["spent"], 150)

        prov_wallet = prov_client.get("/api/wallet/").json()
        self.assertEqual(prov_wallet["balances"]["available"], 450)
        self.assertEqual(prov_wallet["balances"]["earned"], 150)
