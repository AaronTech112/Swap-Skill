from math import ceil
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from marketplace.models import Category, Service, Skill
from marketplace.serializers import (
    CategorySerializer,
    ServiceSerializer,
    ServiceWriteSerializer,
    SkillSerializer,
)


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all().order_by("name")
        return Response(CategorySerializer(categories, many=True).data)


class SkillListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        qs = Skill.objects.all()
        if q:
            qs = qs.filter(name__icontains=q)
        qs = qs.order_by("name")[:30]
        return Response(SkillSerializer(qs, many=True).data)


class ServiceListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        q = request.query_params.get("q", "").strip()
        category = request.query_params.get("category", "").strip()
        sort = request.query_params.get("sort", "newest").strip()

        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (ValueError, TypeError):
            page = 1

        qs = Service.objects.filter(is_active=True).select_related("owner", "category").prefetch_related("skills")

        if category and category.lower() != "all":
            qs = qs.filter(Q(category__name__iexact=category) | Q(category__slug__iexact=category))

        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(skills__name__icontains=q)
                | Q(owner__full_name__icontains=q)
                | Q(owner__handle__icontains=q)
            ).distinct()

        if sort == "credits_asc":
            qs = qs.order_by("credit_cost", "-created_at")
        elif sort == "credits_desc":
            qs = qs.order_by("-credit_cost", "-created_at")
        else:
            qs = qs.order_by("-created_at")

        page_size = 12
        total_count = qs.count()
        total_pages = max(1, ceil(total_count / page_size))

        start = (page - 1) * page_size
        end = start + page_size
        results = qs[start:end]

        return Response({
            "count": total_count,
            "page": page,
            "total_pages": total_pages,
            "results": ServiceSerializer(results, many=True).data,
        })

    def post(self, request):
        serializer = ServiceWriteSerializer(data=request.data)
        if serializer.is_valid():
            service = serializer.save(owner=request.user)
            return Response(ServiceSerializer(service).data, status=status.HTTP_201_CREATED)
        return Response({"detail": "Validation error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class ServiceDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ("PATCH", "DELETE"):
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request, pk):
        service = get_object_or_404(Service.objects.select_related("owner", "category"), pk=pk)
        return Response(ServiceSerializer(service).data)

    def patch(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        if service.owner_id != request.user.pk:
            return Response({"detail": "You do not own this service.", "errors": {}}, status=status.HTTP_403_FORBIDDEN)

        serializer = ServiceWriteSerializer(service, data=request.data, partial=True)
        if serializer.is_valid():
            service = serializer.save()
            return Response(ServiceSerializer(service).data)
        return Response({"detail": "Validation error", "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        service = get_object_or_404(Service, pk=pk)
        if service.owner_id != request.user.pk:
            return Response({"detail": "You do not own this service.", "errors": {}}, status=status.HTTP_403_FORBIDDEN)

        # Deactivate, never hard delete
        service.is_active = False
        service.save(update_fields=["is_active"])
        return Response({"detail": "Service deactivated successfully."})


class MyServicesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        services = Service.objects.filter(owner=request.user).order_by("-created_at")
        return Response(ServiceSerializer(services, many=True).data)
