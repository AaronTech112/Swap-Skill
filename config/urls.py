from django.contrib import admin
from django.urls import include, path
from config.views import index_view

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("config.api_urls")),
    path("", index_view, name="index"),
]
