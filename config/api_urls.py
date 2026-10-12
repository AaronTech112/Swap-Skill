from django.urls import path

from accounts.views import (
    ChangePasswordView,
    LoginView,
    LogoutView,
    MeAuthView,
    ProfileView,
    PublicUserProfileView,
    RegisterView,
)
from marketplace.views import (
    CategoryListView,
    MyServicesView,
    ServiceDetailView,
    ServiceListCreateView,
    SkillListView,
)
from swaps.views import (
    DashboardView,
    DeliveryDownloadView,
    NotificationListView,
    NotificationReadAllView,
    NotificationReadView,
    StatsView,
    SwapAcceptView,
    SwapApproveView,
    SwapCancelView,
    SwapDeclineView,
    SwapDeliverView,
    SwapDetailView,
    SwapListCreateView,
    SwapMessagesView,
    SwapRequestChangesView,
    SwapReviewView,
    WalletView,
)

urlpatterns = [
    # Auth
    path("auth/register/", RegisterView.as_view(), name="api_auth_register"),
    path("auth/login/", LoginView.as_view(), name="api_auth_login"),
    path("auth/logout/", LogoutView.as_view(), name="api_auth_logout"),
    path("auth/me/", MeAuthView.as_view(), name="api_auth_me"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="api_auth_change_password"),

    # Profile
    path("me/", ProfileView.as_view(), name="api_profile"),
    path("users/<int:pk>/", PublicUserProfileView.as_view(), name="api_user_public"),

    # Catalogue
    path("categories/", CategoryListView.as_view(), name="api_categories"),
    path("skills/", SkillListView.as_view(), name="api_skills"),

    # Services
    path("services/", ServiceListCreateView.as_view(), name="api_services"),
    path("services/<int:pk>/", ServiceDetailView.as_view(), name="api_service_detail"),
    path("me/services/", MyServicesView.as_view(), name="api_my_services"),

    # Swaps
    path("swaps/", SwapListCreateView.as_view(), name="api_swaps"),
    path("swaps/<int:pk>/", SwapDetailView.as_view(), name="api_swap_detail"),
    path("swaps/<int:pk>/accept/", SwapAcceptView.as_view(), name="api_swap_accept"),
    path("swaps/<int:pk>/decline/", SwapDeclineView.as_view(), name="api_swap_decline"),
    path("swaps/<int:pk>/cancel/", SwapCancelView.as_view(), name="api_swap_cancel"),
    path("swaps/<int:pk>/deliver/", SwapDeliverView.as_view(), name="api_swap_deliver"),
    path("swaps/<int:pk>/approve/", SwapApproveView.as_view(), name="api_swap_approve"),
    path("swaps/<int:pk>/request-changes/", SwapRequestChangesView.as_view(), name="api_swap_request_changes"),
    path("swaps/<int:pk>/review/", SwapReviewView.as_view(), name="api_swap_review"),
    path("swaps/<int:pk>/messages/", SwapMessagesView.as_view(), name="api_swap_messages"),
    path("deliveries/<int:pk>/download/", DeliveryDownloadView.as_view(), name="api_delivery_download"),

    # Wallet
    path("wallet/", WalletView.as_view(), name="api_wallet"),

    # Notifications
    path("notifications/", NotificationListView.as_view(), name="api_notifications"),
    path("notifications/<int:pk>/read/", NotificationReadView.as_view(), name="api_notification_read"),
    path("notifications/read-all/", NotificationReadAllView.as_view(), name="api_notification_read_all"),

    # Public stats & Dashboard
    path("stats/", StatsView.as_view(), name="api_stats"),
    path("dashboard/", DashboardView.as_view(), name="api_dashboard"),
]
