from django.contrib.auth import authenticate, login, logout, update_session_auth_hash
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.serializers import UserPrivateSerializer, UserPublicSerializer
from marketplace.models import Service, Skill, normalize_skill_name
from swaps.models import Review
from swaps.services import SwapRuleError, register_user


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "")
        full_name = request.data.get("full_name", "").strip()

        errors = {}
        if not email:
            errors["email"] = ["Email is required."]
        if not password:
            errors["password"] = ["Password is required."]
        else:
            try:
                validate_password(password)
            except DjangoValidationError as e:
                errors["password"] = list(e.messages)

        if errors:
            return Response({"detail": "Validation error", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = register_user(
                email=email,
                password=password,
                full_name=full_name,
            )
        except SwapRuleError as exc:
            return Response({"detail": exc.message, "errors": {"email": [exc.message]}}, status=status.HTTP_400_BAD_REQUEST)

        login(request, user)
        return Response(UserPrivateSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required.", "errors": {}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=email, password=password)
        if user is None:
            # Fallback to checking email
            target = User.objects.filter(email__iexact=email).first()
            if target and target.check_password(password):
                user = target

        if user is None:
            return Response(
                {"detail": "Invalid email or password.", "errors": {}},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        login(request, user)
        return Response(UserPrivateSerializer(user).data)


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out successfully."})


class MeAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserPrivateSerializer(request.user).data)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        current_password = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")

        errors = {}
        if not current_password:
            errors["current_password"] = ["Current password is required."]
        elif not request.user.check_password(current_password):
            errors["current_password"] = ["Current password is incorrect."]

        if not new_password:
            errors["new_password"] = ["New password is required."]
        else:
            try:
                validate_password(new_password, user=request.user)
            except DjangoValidationError as e:
                errors["new_password"] = list(e.messages)

        if errors:
            return Response({"detail": "Validation error", "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(new_password)
        request.user.save()
        update_session_auth_hash(request, request.user)
        return Response({"detail": "Password changed successfully."})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserPrivateSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        data = request.data

        if "full_name" in data:
            user.full_name = str(data["full_name"]).strip()
        if "headline" in data:
            user.headline = str(data["headline"]).strip()
        if "bio" in data:
            user.bio = str(data["bio"]).strip()
        if "location" in data:
            user.location = str(data["location"]).strip()

        user.save()

        # Update skills
        if "skills_offered" in data and isinstance(data["skills_offered"], list):
            offered = []
            for name in data["skills_offered"]:
                norm = normalize_skill_name(str(name))
                if norm:
                    skill, _ = Skill.objects.get_or_create(name=norm)
                    offered.append(skill)
            user.skills_offered.set(offered)

        if "skills_wanted" in data and isinstance(data["skills_wanted"], list):
            wanted = []
            for name in data["skills_wanted"]:
                norm = normalize_skill_name(str(name))
                if norm:
                    skill, _ = Skill.objects.get_or_create(name=norm)
                    wanted.append(skill)
            user.skills_wanted.set(wanted)

        return Response(UserPrivateSerializer(user).data)


class PublicUserProfileView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        user_data = UserPublicSerializer(user).data

        # Active services
        active_services = []
        for svc in user.services.filter(is_active=True):
            active_services.append({
                "id": svc.id,
                "title": svc.title,
                "category": svc.category.name,
                "description": svc.description,
                "credit_cost": svc.credit_cost,
                "delivery_days": svc.delivery_days,
                "skills": [s.name for s in svc.skills.all()],
                "created_at": svc.created_at,
            })

        # Reviews received
        reviews_data = []
        for rev in user.received_reviews.all()[:20]:
            reviews_data.append({
                "id": rev.id,
                "author_id": rev.author_id,
                "author_name": rev.author.full_name or rev.author.display_handle,
                "author_handle": rev.author.display_handle,
                "score": rev.score,
                "text": rev.text,
                "swap_title": rev.swap.service_title,
                "created_at": rev.created_at,
            })

        return Response({
            "user": user_data,
            "services": active_services,
            "reviews": reviews_data,
        })
