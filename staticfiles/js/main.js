// static/js/main.js - Application router, layout shell, and lifecycle orchestration

window.currentUser = null;
let currentAppRoute = "";
let badgePollInterval = null;

// Initialize theme immediately
(() => {
  const savedTheme = localStorage.getItem("swapski-theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
})();

function parseHash(hash) {
  const clean = (hash || window.location.hash || "").replace(/^#\/?/, "");
  if (!clean) return { route: "", param: null };
  const parts = clean.split("/").filter(Boolean);
  return {
    route: parts[0] || "",
    param: parts[1] || null,
  };
}

async function fetchMe() {
  try {
    const user = await api.get("auth/me/");
    window.currentUser = user;
    return user;
  } catch (err) {
    window.currentUser = null;
    return null;
  }
}

async function refreshGlobalBadges() {
  if (!window.currentUser) return;
  try {
    const user = await api.get("auth/me/");
    window.currentUser = user;

    // Update notification badges
    const notifBadges = document.querySelectorAll(".badge-unread-notifications");
    notifBadges.forEach((el) => {
      const count = user.unread_notifications || 0;
      el.textContent = count;
      el.style.display = count > 0 ? "inline-block" : "none";
    });

    // Update message badges
    const msgBadges = document.querySelectorAll(".badge-unread-messages");
    msgBadges.forEach((el) => {
      const count = user.unread_messages || 0;
      el.textContent = count;
      el.style.display = count > 0 ? "inline-block" : "none";
    });

    // Update header credits
    const credEl = document.getElementById("header-available-credits");
    if (credEl && user.balances) {
      credEl.textContent = `${user.balances.available} cr`;
    }
  } catch (e) {}
}

function startBadgePolling() {
  if (badgePollInterval) clearInterval(badgePollInterval);
  badgePollInterval = setInterval(refreshGlobalBadges, 30000);
}

function renderPrivateShell(activeRoute) {
  const user = window.currentUser || {};
  const root = document.getElementById("app");
  if (!root) return;

  root.innerHTML = `
    <div class="app-shell d-flex">
      <!-- Desktop Sidebar -->
      <aside class="app-sidebar d-none d-lg-flex flex-column p-3 border-end border-dark-subtle">
        <a href="#/dashboard" class="d-flex align-items-center gap-2 mb-4 text-decoration-none text-light px-2">
          <img src="/static/img/SWAP.png" alt="Swapski" style="height: 32px;" />
          <span class="fs-4 fw-bold">Swapski</span>
        </a>

        <!-- Credits pill -->
        <a href="#/wallet" class="wallet-pill-card p-3 rounded mb-4 text-decoration-none d-flex justify-content-between align-items-center">
          <div>
            <div class="small text-secondary" style="font-size: 0.72rem;">Available Balance</div>
            <div class="fs-5 fw-bold text-cyan" id="header-available-credits">
              ${user.balances?.available ?? 0} cr
            </div>
          </div>
          <i class="bi bi-wallet2 fs-4 text-cyan"></i>
        </a>

        <!-- Nav Links -->
        <nav class="nav flex-column gap-1 flex-grow-1">
          <a href="#/dashboard" class="nav-link-custom ${activeRoute === "dashboard" ? "active" : ""}">
            <i class="bi bi-grid-fill"></i>Overview
          </a>
          <a href="#/marketplace" class="nav-link-custom ${activeRoute === "marketplace" ? "active" : ""}">
            <i class="bi bi-shop"></i>Marketplace
          </a>
          <a href="#/swaps" class="nav-link-custom ${activeRoute === "swaps" ? "active" : ""}">
            <i class="bi bi-arrow-repeat"></i>My Swaps
          </a>
          <a href="#/messages" class="nav-link-custom d-flex justify-content-between align-items-center ${activeRoute === "messages" ? "active" : ""}">
            <div><i class="bi bi-chat-dots-fill me-2"></i>Messages</div>
            <span class="badge bg-danger rounded-pill badge-unread-messages"
                  style="display: ${(user.unread_messages || 0) > 0 ? "inline-block" : "none"}; font-size: 0.7rem;">
              ${user.unread_messages || 0}
            </span>
          </a>
          <a href="#/wallet" class="nav-link-custom ${activeRoute === "wallet" ? "active" : ""}">
            <i class="bi bi-credit-card-2-front-fill"></i>Wallet
          </a>
          <a href="#/notifications" class="nav-link-custom d-flex justify-content-between align-items-center ${activeRoute === "notifications" ? "active" : ""}">
            <div><i class="bi bi-bell-fill me-2"></i>Notifications</div>
            <span class="badge bg-cyan text-dark rounded-pill badge-unread-notifications"
                  style="display: ${(user.unread_notifications || 0) > 0 ? "inline-block" : "none"}; font-size: 0.7rem;">
              ${user.unread_notifications || 0}
            </span>
          </a>
          <a href="#/profile" class="nav-link-custom ${activeRoute === "profile" ? "active" : ""}">
            <i class="bi bi-person-fill"></i>Profile
          </a>
          <a href="#/settings" class="nav-link-custom ${activeRoute === "settings" ? "active" : ""}">
            <i class="bi bi-gear-fill"></i>Settings
          </a>
        </nav>

        <!-- Sidebar Footer Member Details -->
        <div class="pt-3 border-top border-dark-subtle d-flex align-items-center justify-content-between">
          <a href="#/profile" class="d-flex align-items-center gap-2 text-decoration-none text-light flex-grow-1 text-truncate">
            <div class="avatar-mini">${getInitials(user.full_name || user.handle)}</div>
            <div class="text-truncate">
              <div class="small fw-semibold text-truncate">${esc(user.full_name || user.handle)}</div>
              <div class="text-secondary" style="font-size: 0.7rem;">${esc(user.handle)}</div>
            </div>
          </a>
          <button type="button" class="btn btn-link text-secondary p-1" id="sidebar-logout-btn" title="Sign out">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="app-main flex-grow-1 d-flex flex-column min-vh-100 pb-5 pb-lg-0">
        <!-- Top Navbar for Mobile & Tablet -->
        <header class="app-topbar d-flex justify-content-between align-items-center p-3 border-bottom border-dark-subtle">
          <div class="d-flex align-items-center gap-2">
            <a href="#/dashboard" class="d-flex align-items-center gap-2 text-decoration-none text-light">
              <img src="/static/img/SWAP.png" alt="Swapski" style="height: 28px;" />
              <span class="fw-bold fs-5">Swapski</span>
            </a>
          </div>
          <div class="d-flex align-items-center gap-3">
            <a href="#/wallet" class="badge bg-cyan-subtle text-cyan text-decoration-none py-2 px-3 fw-bold border border-cyan-subtle">
              ${user.balances?.available ?? 0} cr
            </a>
            <a href="#/notifications" class="text-light position-relative">
              <i class="bi bi-bell fs-5"></i>
              <span class="badge bg-danger rounded-pill badge-unread-notifications position-absolute top-0 start-100 translate-middle"
                    style="display: ${(user.unread_notifications || 0) > 0 ? "inline-block" : "none"}; font-size: 0.6rem;">
                ${user.unread_notifications || 0}
              </span>
            </a>
            <a href="#/profile" class="text-decoration-none">
              <div class="avatar-mini">${getInitials(user.full_name || user.handle)}</div>
            </a>
          </div>
        </header>

        <!-- View Body -->
        <main class="container-fluid px-3 px-md-4 flex-grow-1" id="app-main-content">
          <!-- Page view loads here -->
        </main>
      </div>

      <!-- Mobile Bottom Nav -->
      <nav class="mobile-bottom-nav d-lg-none fixed-bottom d-flex justify-content-around py-2 border-top border-dark-subtle">
        <a href="#/dashboard" class="bottom-nav-item ${activeRoute === "dashboard" ? "active" : ""}">
          <i class="bi bi-grid-fill"></i>
          <span>Overview</span>
        </a>
        <a href="#/marketplace" class="bottom-nav-item ${activeRoute === "marketplace" ? "active" : ""}">
          <i class="bi bi-shop"></i>
          <span>Market</span>
        </a>
        <a href="#/swaps" class="bottom-nav-item ${activeRoute === "swaps" ? "active" : ""}">
          <i class="bi bi-arrow-repeat"></i>
          <span>Swaps</span>
        </a>
        <a href="#/messages" class="bottom-nav-item position-relative ${activeRoute === "messages" ? "active" : ""}">
          <i class="bi bi-chat-dots-fill"></i>
          <span>Chat</span>
          <span class="badge bg-danger rounded-pill badge-unread-messages position-absolute top-0 end-0"
                style="display: ${(user.unread_messages || 0) > 0 ? "inline-block" : "none"}; font-size: 0.55rem;">
            ${user.unread_messages || 0}
          </span>
        </a>
        <a href="#/wallet" class="bottom-nav-item ${activeRoute === "wallet" ? "active" : ""}">
          <i class="bi bi-wallet2"></i>
          <span>Wallet</span>
        </a>
      </nav>
    </div>
  `;

  document.getElementById("sidebar-logout-btn")?.addEventListener("click", () => {
    confirmDialog({
      title: "Sign Out",
      message: "Are you sure you want to sign out?",
      confirmText: "Sign Out",
      confirmClass: "btn-danger",
      onConfirm: async () => {
        try {
          await api.post("auth/logout/");
          window.currentUser = null;
          showToast("Signed out.", "info");
          window.location.hash = "#/landing";
        } catch (e) {
          window.location.hash = "#/landing";
        }
      },
    });
  });
}

async function router() {
  const { route, param } = parseHash();

  // If no auth session loaded yet, fetch it
  if (window.currentUser === null) {
    await fetchMe();
    if (window.currentUser) {
      startBadgePolling();
    }
  }

  // Handle default route
  let targetRoute = route;
  if (!targetRoute) {
    targetRoute = window.currentUser ? "dashboard" : "landing";
    window.location.hash = `#/${targetRoute}`;
    return;
  }

  // Public routes list
  const publicRoutes = ["landing", "signin", "signup", "marketplace", "users"];
  const isPublicRoute = publicRoutes.includes(targetRoute);

  // Unauthenticated user attempting to access private route
  if (!window.currentUser && !isPublicRoute) {
    showToast("Please sign in to access this page.", "info");
    window.location.hash = "#/signin";
    return;
  }

  // Authenticated user attempting to access auth forms
  if (window.currentUser && ["signin", "signup"].includes(targetRoute)) {
    window.location.hash = "#/dashboard";
    return;
  }

  // Stop chat polling if navigating away from chat
  if (targetRoute !== "swaps" && targetRoute !== "messages" && typeof stopChatPolling === "function") {
    stopChatPolling();
  }

  currentAppRoute = targetRoute;

  // Render Layout Structure:
  // If user is authenticated and viewing an internal/app page, use the persistent shell!
  const isAppView = window.currentUser && !["landing"].includes(targetRoute);

  if (isAppView) {
    // If shell not already mounted, mount it
    const mainContent = document.getElementById("app-main-content");
    if (!mainContent) {
      renderPrivateShell(targetRoute);
    } else {
      // Update active nav links
      document.querySelectorAll(".nav-link-custom").forEach((link) => {
        const href = link.getAttribute("href") || "";
        link.classList.toggle("active", href.includes(`#/${targetRoute}`));
      });
      document.querySelectorAll(".bottom-nav-item").forEach((link) => {
        const href = link.getAttribute("href") || "";
        link.classList.toggle("active", href.includes(`#/${targetRoute}`));
      });
    }
  }

  // Render page components
  switch (targetRoute) {
    case "landing":
      if (typeof renderLanding === "function") await renderLanding();
      break;

    case "signin":
      if (typeof renderSignIn === "function") renderSignIn();
      break;

    case "signup":
      if (typeof renderSignUp === "function") renderSignUp();
      break;

    case "onboarding":
      if (typeof renderOnboarding === "function") await renderOnboarding();
      break;

    case "dashboard":
      if (typeof renderDashboard === "function") await renderDashboard();
      break;

    case "marketplace":
      if (typeof renderMarketplace === "function") await renderMarketplace();
      break;

    case "swaps":
      if (param) {
        if (typeof renderSwapDetail === "function") await renderSwapDetail(param);
      } else {
        if (typeof renderSwaps === "function") await renderSwaps();
      }
      break;

    case "messages":
      if (typeof renderMessages === "function") await renderMessages();
      break;

    case "wallet":
      if (typeof renderWallet === "function") await renderWallet();
      break;

    case "notifications":
      if (typeof renderNotifications === "function") await renderNotifications();
      break;

    case "profile":
      if (typeof renderProfile === "function") await renderProfile();
      break;

    case "users":
      if (param) {
        if (typeof renderPublicProfile === "function") await renderPublicProfile(param);
      } else {
        window.location.hash = "#/marketplace";
      }
      break;

    case "settings":
      if (typeof renderSettings === "function") await renderSettings();
      break;

    default:
      window.location.hash = window.currentUser ? "#/dashboard" : "#/landing";
      break;
  }

  window.scrollTo(0, 0);
}

// Global modal dismiss & hotkeys
document.addEventListener("click", (e) => {
  if (e.target.matches('[data-action="close-modal"]')) {
    if (typeof closeModal === "function") closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (typeof closeModal === "function") closeModal();
  }
});

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);
