const { artwork, initialState, skillLibrary } = window.SWAPSKI_DATA || {};

if (!artwork || !initialState || !skillLibrary) {
  throw new Error("Swapski data failed to load. Make sure data.js is loaded before app.js.");
}

const app = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const toastStack = document.getElementById("toast-stack");
const STORAGE_KEY = "swapski-spa-state-v1";

let state = hydrateState();

window.addEventListener("hashchange", syncRouteFromHash);
document.addEventListener("click", handleClick);
document.addEventListener("submit", handleSubmit);
document.addEventListener("input", handleInput);
document.addEventListener("change", handleChange);

syncRouteFromHash();
renderApp();

function hydrateState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return clone(initialState);
  try {
    return mergeState(initialState, JSON.parse(saved));
  } catch {
    return clone(initialState);
  }
}

function mergeState(base, patch) {
  return {
    ...clone(base),
    ...patch,
    session: { ...base.session, ...(patch.session || {}) },
    ui: { ...base.ui, ...(patch.ui || {}) },
    preferences: { ...base.preferences, ...(patch.preferences || {}) },
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function setState(updater, options = {}) {
  updater(state);
  persist();
  if (!options.silent) {
    renderApp();
  }
}

function syncRouteFromHash() {
  const route = window.location.hash.replace("#/", "") || state.ui.route || "landing";
  const normalized = normalizeRoute(route);
  if (state.ui.route !== normalized) {
    state.ui.route = normalized;
    persist();
  }
  renderApp();
}

function normalizeRoute(route) {
  const routes = [
    "landing",
    "auth",
    "onboarding",
    "dashboard",
    "marketplace",
    "profile",
    "requests",
    "wallet",
    "messages",
    "tasks",
    "settings",
  ];
  if (!routes.includes(route)) return "landing";
  if (!state.session.isAuthenticated && !["landing", "auth", "onboarding"].includes(route)) {
    return "landing";
  }
  return route;
}

function navigate(route) {
  window.location.hash = `#/${route}`;
}

function renderApp() {
  if (!app) return;
  const route = normalizeRoute(state.ui.route);
  const isAuthed = state.session.isAuthenticated;

  if (!isAuthed && route === "onboarding") {
    state.ui.route = "auth";
  }

  if (!isAuthed || ["landing", "auth", "onboarding"].includes(route)) {
    app.innerHTML = renderPublicView(route);
  } else {
    app.innerHTML = renderPrivateView(route);
  }

  modalRoot.innerHTML = renderModal();
  animateCounters();
  applyMotionPreference();
}

function renderPublicView(route) {
  if (route === "auth") return renderAuth();
  if (route === "onboarding") return renderOnboarding();
  return renderLanding();
}

function renderPrivateView(route) {
  const pageMap = {
    dashboard: renderDashboard,
    marketplace: renderMarketplace,
    profile: renderProfile,
    requests: renderRequests,
    wallet: renderWallet,
    messages: renderMessages,
    tasks: renderTasks,
    settings: renderSettings,
  };

  const currentUser = getCurrentUser();

  return `
    <div class="shell fade-in">
      <div class="dashboard-layout">
        <aside class="glass-card app-sidebar">
          ${renderBrand("Skill Exchange Marketplace")}
          <div class="sidebar-links mt-4">
            ${navLink("dashboard", "Overview", "bi-grid-1x2")}
            ${navLink("marketplace", "Marketplace", "bi-stars")}
            ${navLink("profile", "Profile", "bi-person-bounding-box")}
            ${navLink("requests", "Requests", "bi-hourglass-split")}
            ${navLink("wallet", "Wallet", "bi-wallet2")}
            ${navLink("messages", "Messages", "bi-chat-left-dots")}
            ${navLink("tasks", "Tasks", "bi-kanban")}
            ${navLink("settings", "Settings", "bi-sliders")}
          </div>
          <div class="glass-card-soft p-3 mt-4">
            <div class="card-header-row">
              <div>
                <strong>${currentUser.name}</strong>
                <div class="muted">${currentUser.handle}</div>
              </div>
              <span class="badge-soft">${currentUser.trustScore} trust</span>
            </div>
            <button class="btn-ghost w-100 mt-3" data-action="logout">Sign out</button>
          </div>
        </aside>
        <main class="app-main">
          <div class="glass-card page-shell">
            <div class="app-topbar glass-card-soft">
              <div class="brand-lockup">
                <img src="./SWAP.png" alt="Swapski Logo" class="swapski-logo-img sm" />
                <div class="badge-soft">
                  <i class="bi bi-shield-check text-cyan"></i> Swapski Network
                </div>
              </div>
              <div class="topbar-actions">
                <div class="topbar-pill">
                  <i class="bi bi-bell"></i>
                  <span>${state.notifications.length} alerts</span>
                </div>
                <div class="topbar-pill">
                  <i class="bi bi-lightning-charge"></i>
                  <span>${formatCredits(getWalletMetrics(currentUser.id).available)}</span>
                </div>
                <button class="btn-gradient" data-route="marketplace">Start a swap</button>
              </div>
            </div>
            ${(pageMap[route] || renderDashboard)()}
          </div>
          ${renderBottomNav()}
        </main>
      </div>
    </div>
  `;
}

function renderLanding() {
  const featuredServices = getVisibleServices().slice(0, 3);
  const topUsers = state.users.slice(0, 3);

  return `
    <div class="shell fade-in">
      <div class="glass-card hero-shell">
        <div class="brand-nav glass-card-soft">
          ${renderBrand("Exchange Skills. Not Money.")}
          <div class="nav-links">
            <a class="nav-link-chip" href="#how-it-works">How it works</a>
            <a class="nav-link-chip" href="#market-signal">Marketplace</a>
            <a class="nav-link-chip" href="#trust-layer">Trust layer</a>
            <button class="btn-ghost" data-route="auth">Sign in</button>
            <button class="btn-gradient" data-action="launch-demo">Launch demo</button>
          </div>
        </div>

        <section class="hero-grid">
          <div class="hero-copy">
            <div class="section-kicker">Skill Exchange</div>
            <h1>
              Build together.
              <span class="gradient-text">Exchange skills.</span>
            </h1>
            <p>
              Swapski lets you earn Swap Credits by helping others, then spend them to unlock expert help—no money needed.
            </p>
            <div class="hero-actions">
              <button class="btn-gradient" data-action="launch-demo">Enter Product Demo</button>
              <button class="btn-ghost" data-route="auth">Create account</button>
            </div>
            <div class="hero-metrics">
              ${metricCard("4.9", "Rating")}
              ${metricCard("12,400", "Credits Swapped")}
              ${metricCard("91%", "Approval Rate")}
            </div>
          </div>
          <div class="hero-panel">
            <div class="preview-card primary">
              <div class="preview-header">
                <div>
                  <div class="eyebrow">Credit Escrow</div>
                  <h3 class="mt-3 mb-1">Protected Swaps</h3>
                </div>
                <span class="badge-soft">Verified</span>
              </div>
              <div class="preview-chart">
                <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
              </div>
              <div class="hero-metrics mt-4">
                ${metricCard("320", "Earned")}
                ${metricCard("120", "Escrow")}
                ${metricCard("340", "Available")}
              </div>
            </div>
            <div class="preview-card secondary">
              <div class="preview-header">
                <strong>Live Workflow</strong>
                <span class="status-chip review">Active</span>
              </div>
              <div class="activity-list">
                ${activityRow("bi-person-plus", "Create Profile", "Add skills you offer & need.")}
                ${activityRow("bi-stars", "Discover Help", "Browse services by category & trust.")}
                ${activityRow("bi-shield-check", "Protected Escrow", "Lock credits safely until delivery.")}
              </div>
            </div>
          </div>
        </section>
      </div>

      <section id="market-signal" class="section-spacing glass-card page-shell">
        <div class="section-header">
          <div>
            <div class="section-kicker">The Solution</div>
            <h2 class="mt-3">Talent over cash.</h2>
            <p>
              Connect with talented builders, trade real value, and move projects forward with trust.
            </p>
          </div>
        </div>
        <div class="story-grid">
          <article class="story-card">
            <div class="eyebrow">Why Swapski</div>
            <div class="activity-list mt-3">
              ${activityRow("bi-cash-stack", "No Cash Barriers", "Get high-end work done using earned credits.")}
              ${activityRow("bi-lightbulb", "Monetize Skills", "Turn your expertise into currency for other services.")}
              ${activityRow("bi-shield-check", "Built-in Escrow", "Credits are locked safely until you approve work.")}
            </div>
          </article>
          <article class="story-card story-image">
            <img src="${artwork.hero}" alt="Swapski preview scene" />
          </article>
        </div>
      </section>

      <section id="how-it-works" class="section-spacing glass-card page-shell">
        <div class="section-header">
          <div>
            <div class="section-kicker">How it works</div>
            <h2 class="mt-3">Skill to Credit to Help.</h2>
          </div>
        </div>
        <div class="feature-grid">
          ${storyStep("01", "Create Profile", "List your offered & requested skills.")}
          ${storyStep("02", "Complete Swaps", "Earn credits by delivering work.")}
          ${storyStep("03", "Request Help", "Lock credits in escrow for services.")}
          ${storyStep("04", "Approve & Release", "Release credits once satisfied.")}
          ${storyStep("05", "Build Trust", "Earn ratings & expand your score.")}
          ${storyStep("06", "Grow Together", "Unlock top collaborators.")}
        </div>
      </section>

      <section class="section-spacing glass-card page-shell">
        <div class="section-header">
          <div>
            <div class="section-kicker">Featured Services</div>
            <h2 class="mt-3">Available for Exchange</h2>
          </div>
          <button class="btn-ghost" data-action="launch-demo">Explore Marketplace</button>
        </div>
        <div class="testimonial-grid">
          ${featuredServices.map((service) => renderLandingServiceCard(service)).join("")}
        </div>
      </section>

      <section id="trust-layer" class="section-spacing glass-card page-shell">
        <div class="section-header">
          <div>
            <div class="section-kicker">Trust Layer</div>
            <h2 class="mt-3">Verified Ratings & Escrow</h2>
          </div>
        </div>
        <div class="testimonial-grid">
          ${topUsers.map((user) => renderTestimonial(user)).join("")}
        </div>
      </section>
    </div>
  `;
}

function renderAuth() {
  return `
    <div class="auth-shell fade-in">
      <div class="glass-card p-4">
        <div class="brand-nav glass-card-soft mb-4">
          ${renderBrand("Premium skill exchange, without the price tag.")}
          <div class="nav-links">
            <button class="btn-ghost" data-route="landing">Back home</button>
          </div>
        </div>
        <div class="auth-grid">
          <section class="glass-card auth-story p-4">
            <div class="section-kicker">Onboarding</div>
            <h1 class="mt-3 mb-3">Create a trusted identity before you start swapping.</h1>
            <p class="muted">
              Build a profile, choose the work you offer, define what you need, and let the
              marketplace surface relevant exchange opportunities.
            </p>
            <div class="hero-image mt-4">
              <img src="${artwork.onboarding}" alt="Swapski onboarding illustration" />
            </div>
            <div class="hero-metrics mt-4">
              ${metricCard("Secure", "Local session demo")}
              ${metricCard("Fast", "Guided setup flow")}
              ${metricCard("Smart", "Skill-based matches")}
            </div>
          </section>
          <section class="glass-card auth-card">
            <div class="eyebrow">Create your account</div>
            <h2 class="mt-3">Join Swapski</h2>
            <p class="muted">
              This frontend demo simulates authentication and then carries you into onboarding and the live product shell.
            </p>
            <form id="auth-form" class="mt-4">
              <div class="mb-3">
                <label class="form-label" for="auth-name">Full name</label>
                <input class="form-control" id="auth-name" name="name" value="${getCurrentUser().name}" required />
              </div>
              <div class="mb-3">
                <label class="form-label" for="auth-email">Email</label>
                <input class="form-control" id="auth-email" name="email" value="maya@swapski.app" required />
              </div>
              <div class="mb-3">
                <label class="form-label" for="auth-password">Password</label>
                <input class="form-control" id="auth-password" name="password" type="password" value="password123" required />
              </div>
              <div class="d-grid gap-2 mt-4">
                <button class="btn-gradient" type="submit">Continue to onboarding</button>
                <button class="btn-ghost" type="button" data-action="quick-signin">Use instant demo account</button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  `;
}

function renderOnboarding() {
  const currentUser = getCurrentUser();
  return `
    <div class="auth-shell fade-in">
      <div class="glass-card onboarding-card">
        <div class="page-header">
          <div class="page-title">
            <div class="section-kicker">Profile builder</div>
            <h1 class="mt-3">Shape your exchange identity.</h1>
            <p>Pick the skills you offer, define what you need, and we will drop you directly into the dashboard.</p>
          </div>
          <div class="badge-soft">Step 2 of 2</div>
        </div>
        <form id="onboarding-form">
          <div class="row g-4">
            <div class="col-lg-6">
              <label class="form-label" for="headline">Headline</label>
              <input class="form-control" id="headline" name="headline" value="${currentUser.headline}" />
            </div>
            <div class="col-lg-3">
              <label class="form-label" for="timezone">Timezone</label>
              <input class="form-control" id="timezone" name="timezone" value="${currentUser.timezone}" />
            </div>
            <div class="col-lg-3">
              <label class="form-label" for="location">Location</label>
              <input class="form-control" id="location" name="location" value="${currentUser.location}" />
            </div>
            <div class="col-12">
              <label class="form-label" for="bio">Bio</label>
              <textarea class="form-control" id="bio" name="bio" rows="4">${currentUser.bio}</textarea>
            </div>
            <div class="col-12">
              <label class="form-label">Skills you offer</label>
              <div class="skill-cloud">
                ${skillLibrary
                  .map((skill) => skillToggle(skill, currentUser.skillsOffered.includes(skill), "offered"))
                  .join("")}
              </div>
            </div>
            <div class="col-12">
              <label class="form-label">Skills you want</label>
              <div class="skill-cloud">
                ${skillLibrary
                  .map((skill) => skillToggle(skill, currentUser.skillsWanted.includes(skill), "wanted"))
                  .join("")}
              </div>
            </div>
          </div>
          <div class="hero-actions mt-4">
            <button class="btn-gradient" type="submit">Finish onboarding</button>
            <button class="btn-ghost" type="button" data-route="landing">Back</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const user = getCurrentUser();
  const wallet = getWalletMetrics(user.id);
  const activeRequests = getRequestsForUser(user.id);
  const recommended = getVisibleServices().filter((service) => service.userId !== user.id).slice(0, 2);

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Dashboard</div>
          <h1 class="mt-3">Welcome back, ${user.name.split(" ")[0]}.</h1>
          <p>Your premium skill exchange cockpit: credits, tasks, trust, and next-best opportunities.</p>
        </div>
        <div class="inline-actions">
          <button class="btn-ghost" data-route="wallet">View wallet</button>
          <button class="btn-gradient" data-route="marketplace">Discover services</button>
        </div>
      </div>

      <div class="stats-grid">
        ${dashboardStat("Available credits", formatCredits(wallet.available), "bi-wallet2")}
        ${dashboardStat("In escrow", formatCredits(wallet.escrow), "bi-safe")}
        ${dashboardStat("Completion rate", `${user.completedSwaps} swaps`, "bi-check2-circle")}
        ${dashboardStat("Response time", user.responseTime, "bi-lightning-charge")}
      </div>

      <div class="dashboard-grid">
        <section class="dashboard-card">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Activity feed</div>
              <h3 class="mt-3 mb-1">Recent movement</h3>
            </div>
            <span class="badge-soft">${state.notifications.length} signals</span>
          </div>
          <div class="activity-list">
            ${state.notifications.map((item) => activityRow("bi-activity", item.title, item.body)).join("")}
            ${activityRow("bi-shield-lock", "Escrow is active", `${formatCredits(wallet.escrow)} are currently locked until review resolves.`)}
            ${activityRow("bi-stars", "Recommended next step", "Finish your landing page review to release credits and strengthen your reputation graph.")}
          </div>
        </section>
        <section class="dashboard-card">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Suggested swaps</div>
              <h3 class="mt-3 mb-1">High-fit services</h3>
            </div>
            <button class="btn-outline-soft" data-route="marketplace">See all</button>
          </div>
          <div class="service-list mt-3">
            ${recommended.map((service) => compactService(service)).join("")}
          </div>
        </section>
      </div>

      <div class="dashboard-grid">
        <section class="dashboard-card">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Active work</div>
              <h3 class="mt-3 mb-1">Open requests</h3>
            </div>
            <button class="btn-outline-soft" data-route="requests">Open workflow</button>
          </div>
          <div class="timeline-list mt-3">
            ${activeRequests.map((request) => requestSummaryCard(request)).join("")}
          </div>
        </section>
        <section class="dashboard-card">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Trust profile</div>
              <h3 class="mt-3 mb-1">Reputation snapshot</h3>
            </div>
            <span class="badge-soft">${user.rating.toFixed(1)} stars</span>
          </div>
          <div class="activity-list">
            ${activityRow("bi-patch-check", "Trust score", `${user.trustScore}/100 based on ratings, response time, and completed swaps.`)}
            ${activityRow("bi-chat-square-heart", "Top review", getReviewsForUser(user.id)[0]?.review || "Your next completed swap will create new social proof.")}
            ${activityRow("bi-people", "Skill graph", `${user.skillsOffered.join(", ")}.`)}
          </div>
        </section>
      </div>
    </section>
  `;
}

function getCategoryIcon(cat) {
  const icons = {
    All: "bi-grid-fill",
    "UI Design": "bi-palette",
    "Frontend Dev": "bi-code-slash",
    "Product Strategy": "bi-compass",
    "Motion Design": "bi-film",
    "Copywriting": "bi-pen-fill",
    "Video Editing": "bi-camera-reels",
    "SEO": "bi-search",
    "Research": "bi-journal-text",
    "Tutoring": "bi-mortarboard",
    "Brand Identity": "bi-vector-pen",
    "Pitch Decks": "bi-easel",
    "No-Code": "bi-cpu"
  };
  return icons[cat] || "bi-stars";
}

function renderMarketplace() {
  const categories = ["All", ...new Set(state.services.map((service) => service.category))];
  const services = getVisibleServices();
  const currentUser = getCurrentUser();

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Marketplace</div>
          <h1 class="mt-3">Discover & Exchange Services</h1>
          <p>Find verified collaborators and exchange Swap Credits for top-quality work.</p>
        </div>
        <button class="btn-gradient" data-action="open-create-service">Create service</button>
      </div>

      <div class="market-grid">
        <div>
          <div class="glass-card-soft filter-shell mb-4">
            <div class="row g-3 align-items-center">
              <div class="col-md-9">
                <input class="form-control" id="search-services" name="marketplaceSearch" placeholder="Search by skill, title, or creator..." value="${state.ui.marketplaceSearch}" />
              </div>
              <div class="col-md-3">
                <button class="btn-ghost w-100" data-action="reset-filters" type="button">Reset</button>
              </div>
            </div>
            <div class="category-nav-bar">
              ${categories.map((cat) => `
                <button class="category-tab ${cat === state.ui.marketplaceCategory ? "active" : ""}" data-action="select-category" data-category="${cat}" type="button">
                  <i class="bi ${getCategoryIcon(cat)}"></i>
                  <span>${cat}</span>
                </button>
              `).join("")}
            </div>
          </div>
          <div class="services-grid">
            ${services.length > 0 
              ? services.map((service) => renderServiceCard(service, currentUser.id)).join("")
              : '<div class="glass-card p-4 text-center muted">No services found in this category.</div>'}
          </div>
        </div>
        <aside class="glass-card drawer">
          <div class="eyebrow">Smart Wallet</div>
          <h3 class="mt-3">Balance & Escrow</h3>
          <p class="muted mb-3">Derived automatically from active requests.</p>
          <div class="wallet-bars">
            ${walletBar("Available", getWalletMetrics(currentUser.id).available, getWalletMetrics(currentUser.id).available, "100%")}
            ${walletBar("Escrowed", getWalletMetrics(currentUser.id).escrow, 200, `${Math.min(100, (getWalletMetrics(currentUser.id).escrow / 200) * 100)}%`)}
          </div>
        </aside>
      </div>
    </section>
  `;
}

function renderProfile() {
  const user = getCurrentUser();
  const myServices = state.services.filter((service) => service.userId === user.id);
  const reviews = getReviewsForUser(user.id);

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Profile</div>
          <h1 class="mt-3">Your public exchange profile.</h1>
          <p>Everything other members need to trust you: skills, reputation, service packaging, and delivery signals.</p>
        </div>
        <div class="inline-actions">
          <button class="btn-ghost" data-route="onboarding">Edit onboarding</button>
          <button class="btn-gradient" data-action="open-create-service">Add service</button>
        </div>
      </div>
      <div class="profile-layout">
        <aside class="content-stack">
          <div class="profile-card profile-hero">
            <div class="profile-cover"></div>
            <div class="card-header-row">
              <div class="avatar-ring">${user.avatar}</div>
              <div>
                <h3 class="mb-1">${user.name}</h3>
                <div class="profile-meta">${user.handle} • ${user.location}</div>
              </div>
            </div>
            <div class="chip-row">
              <span class="badge-soft">${user.trustScore} trust score</span>
              <span class="badge-soft">${user.rating.toFixed(1)} rating</span>
              <span class="badge-soft">${user.completedSwaps} swaps</span>
            </div>
            <p class="muted">${user.bio}</p>
          </div>

          <div class="profile-card">
            <div class="eyebrow">Skills offered</div>
            <div class="skill-cloud mt-3">
              ${user.skillsOffered.map((skill) => `<span class="skill-chip active">${skill}</span>`).join("")}
            </div>
            <div class="eyebrow mt-4">Skills wanted</div>
            <div class="skill-cloud mt-3">
              ${user.skillsWanted.map((skill) => `<span class="skill-chip">${skill}</span>`).join("")}
            </div>
          </div>
        </aside>

        <div class="content-stack">
          <div class="profile-card">
            <div class="card-header-row">
              <div>
                <div class="eyebrow">Services</div>
                <h3 class="mt-3 mb-1">What you currently offer</h3>
              </div>
              <button class="btn-outline-soft" data-action="open-create-service">Create service</button>
            </div>
            <div class="service-list mt-3">
              ${myServices.map((service) => compactService(service, true)).join("")}
            </div>
          </div>

          <div class="profile-card">
            <div class="card-header-row">
              <div>
                <div class="eyebrow">Reviews</div>
                <h3 class="mt-3 mb-1">What people say about your swaps</h3>
              </div>
            </div>
            <div class="review-list mt-3">
              ${reviews.map((review) => renderReview(review)).join("")}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderRequests() {
  const requests = getRequestsForUser(getCurrentUser().id);
  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Requests</div>
          <h1 class="mt-3">Track escrow, delivery, review, and release.</h1>
          <p>Each request keeps service terms, task updates, and credit movement tied together in one place.</p>
        </div>
        <button class="btn-gradient" data-route="messages">Open task chat</button>
      </div>
      <div class="request-grid">
        ${requests.map((request) => requestWorkflowCard(request)).join("")}
      </div>
    </section>
  `;
}

function renderWallet() {
  const wallet = getWalletMetrics(getCurrentUser().id);
  const ledger = state.ledger
    .filter((entry) => entry.userId === getCurrentUser().id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Wallet</div>
          <h1 class="mt-3">Immutable Swap Credit ledger.</h1>
          <p>Balances are derived from transaction records so the credit system stays transparent and backend-ready.</p>
        </div>
      </div>
      <div class="wallet-grid">
        <section class="wallet-card">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Wallet summary</div>
              <h3 class="mt-3 mb-1">Credit health</h3>
            </div>
            <span class="badge-soft">Live derived</span>
          </div>
          <div class="hero-metrics mt-4">
            ${metricCard(formatCredits(wallet.available), "Available")}
            ${metricCard(formatCredits(wallet.earned), "Earned all time")}
            ${metricCard(formatCredits(wallet.spent), "Spent all time")}
          </div>
          <div class="wallet-bars">
            ${walletBar("Escrowed", wallet.escrow, Math.max(wallet.earned, 1), `${Math.max(6, (wallet.escrow / Math.max(wallet.earned, 1)) * 100)}%`)}
            ${walletBar("Available", wallet.available, Math.max(wallet.earned, 1), `${Math.max(10, (wallet.available / Math.max(wallet.earned, 1)) * 100)}%`)}
          </div>
          <div class="hero-image mt-4">
            <img src="${artwork.wallet}" alt="Futuristic Swapski wallet illustration" />
          </div>
        </section>
        <section class="ledger-card">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Ledger history</div>
              <h3 class="mt-3 mb-1">Every credit event</h3>
            </div>
          </div>
          <div class="ledger-list mt-3">
            ${ledger.map((entry) => ledgerRow(entry)).join("")}
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderMessages() {
  const conversations = getConversationSummaries();
  const activeId = state.ui.activeInboxRequestId || conversations[0]?.request.id;
  const activeConversation = conversations.find((item) => item.request.id === activeId) || conversations[0];

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Messaging</div>
          <h1 class="mt-3">Task chat linked to real requests.</h1>
          <p>Every thread carries context, escrow state, and the request timeline so nobody loses the plot mid-swap.</p>
        </div>
      </div>
      <div class="messages-layout">
        <aside class="glass-card conversation-list">
          <div class="eyebrow">Conversations</div>
          <div class="service-list mt-3">
            ${conversations.map((summary) => renderConversationRow(summary, summary.request.id === activeId)).join("")}
          </div>
        </aside>
        <section class="glass-card conversation-panel">
          ${activeConversation ? renderConversationPanel(activeConversation) : "<p class='muted'>No conversations yet.</p>"}
        </section>
      </div>
    </section>
  `;
}

function renderTasks() {
  const columns = [
    { key: "requested", label: "Requested" },
    { key: "accepted", label: "Accepted" },
    { key: "in_progress", label: "In progress" },
    { key: "review", label: "In review" },
    { key: "completed", label: "Completed" },
  ];
  const requests = getRequestsForUser(getCurrentUser().id);

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Task management</div>
          <h1 class="mt-3">A lightweight workboard for active swaps.</h1>
          <p>See which services are waiting, moving, ready for review, or fully complete.</p>
        </div>
      </div>
      <div class="task-grid">
        ${columns
          .map((column) => {
            const columnRequests = requests.filter((request) => request.status === column.key);
            return `
              <section class="glass-card kanban-column">
                <div class="card-header-row">
                  <h3>${column.label}</h3>
                  <span class="badge-soft">${columnRequests.length}</span>
                </div>
                <div class="content-stack mt-3">
                  ${columnRequests.length ? columnRequests.map((request) => taskCard(request)).join("") : "<div class='task-card muted'>No tasks in this column right now.</div>"}
                </div>
              </section>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderSettings() {
  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Settings</div>
          <h1 class="mt-3">Preferences, privacy, and polished defaults.</h1>
          <p>The demo stores your choices locally so the app feels persistent across refreshes.</p>
        </div>
      </div>
      <div class="settings-grid">
        <section class="setting-card">
          <div class="eyebrow">Notifications</div>
          <div class="toggle-row mt-4">
            <div>
              <strong>Smart alerts</strong>
              <div class="muted">Escrow changes, reviews, and task delivery reminders.</div>
            </div>
            ${switchControl("smartNotifications", state.preferences.smartNotifications)}
          </div>
          <div class="toggle-row">
            <div>
              <strong>Weekly digest</strong>
              <div class="muted">Opportunity summaries and reputation updates.</div>
            </div>
            ${switchControl("weeklyDigest", state.preferences.weeklyDigest)}
          </div>
        </section>
        <section class="setting-card">
          <div class="eyebrow">Privacy & motion</div>
          <div class="toggle-row mt-4">
            <div>
              <strong>Public profile</strong>
              <div class="muted">Let other users discover your service packages and trust stats.</div>
            </div>
            ${switchControl("publicProfile", state.preferences.publicProfile)}
          </div>
          <div class="toggle-row">
            <div>
              <strong>Reduced motion</strong>
              <div class="muted">Tone down ambient movement while keeping the interface premium.</div>
            </div>
            ${switchControl("reducedMotion", state.preferences.reducedMotion)}
          </div>
        </section>
      </div>
    </section>
  `;
}

function renderModal() {
  if (state.ui.showCreateService) {
    return `
      <div class="modal-overlay" data-action="close-modal">
        <div class="glass-card modal-card" data-stop-propagation="true">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Create service</div>
              <h3 class="mt-3 mb-1">Package your skill clearly.</h3>
            </div>
            <button class="btn-outline-soft" data-action="close-modal">Close</button>
          </div>
          <form id="create-service-form" class="mt-4">
            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label" for="service-title">Service title</label>
                <input class="form-control" id="service-title" name="title" placeholder="Premium API integration sprint" required />
              </div>
              <div class="col-md-4">
                <label class="form-label" for="service-category">Category</label>
                <select class="form-select" id="service-category" name="category">
                  <option>Development</option>
                  <option>Design</option>
                  <option>Creative</option>
                  <option>Research</option>
                  <option>Strategy</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="service-cost">Credit cost</label>
                <input class="form-control" id="service-cost" name="creditCost" type="number" min="10" value="90" required />
              </div>
              <div class="col-md-4">
                <label class="form-label" for="service-delivery">Delivery time</label>
                <input class="form-control" id="service-delivery" name="deliveryTime" value="3 days" required />
              </div>
              <div class="col-md-4">
                <label class="form-label" for="service-tags">Tags</label>
                <input class="form-control" id="service-tags" name="tags" value="Bootstrap, UX, Audit" required />
              </div>
              <div class="col-12">
                <label class="form-label" for="service-description">Description</label>
                <textarea class="form-control" id="service-description" name="description" rows="4" required>I will package a high-value service with clear outcomes, delivery timing, and credit pricing.</textarea>
              </div>
            </div>
            <div class="hero-actions mt-4 mb-0">
              <button class="btn-gradient" type="submit">Create service</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  const service = state.services.find((item) => item.id === state.ui.requestServiceId);
  if (!service) return "";
  const owner = getUser(service.userId);
  const wallet = getWalletMetrics(getCurrentUser().id);
  const remainingAfter = wallet.available - service.creditCost;

  return `
    <div class="modal-overlay" data-action="close-modal">
      <div class="glass-card modal-card" data-stop-propagation="true">
        <div class="card-header-row">
          <div>
            <div class="eyebrow">Request service</div>
            <h3 class="mt-3 mb-1">${service.title}</h3>
          </div>
          <button class="btn-outline-soft" data-action="close-modal">Close</button>
        </div>
        <p class="muted mt-3">${service.description}</p>
        <div class="hero-metrics mt-4">
          ${metricCard(formatCredits(service.creditCost), "Will be locked in escrow")}
          ${metricCard(service.deliveryTime, "Delivery time")}
          ${metricCard(`${owner.rating.toFixed(1)} rating`, "Provider trust")}
        </div>
        <div class="activity-list mt-4">
          ${activityRow("bi-safe2", "Escrow lock", "Credits are reserved immediately and stay protected until you approve the work.")}
          ${activityRow("bi-wallet2", "Available after request", remainingAfter >= 0 ? `${formatCredits(remainingAfter)} remain available after the lock.` : "You need more available credits before requesting this service.")}
        </div>
        <form id="request-service-form" class="mt-4">
          <input type="hidden" name="serviceId" value="${service.id}" />
          <label class="form-label" for="request-message">What do you need?</label>
          <textarea class="form-control" id="request-message" name="message" rows="4" placeholder="Explain the task, context, and desired outcome..." required>${state.ui.requestMessage || ""}</textarea>
          <div class="hero-actions mt-4 mb-0">
            <button class="btn-gradient" type="submit" ${remainingAfter < 0 ? "disabled" : ""}>Lock credits and send request</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

function handleClick(event) {
  const target = event.target.closest("[data-action], [data-route], [data-request-id], [data-conversation-id]");
  if (event.target.closest("[data-stop-propagation='true']")) {
    event.stopPropagation();
  }
  if (!target) return;

  triggerRipple(target);

  if (target.dataset.route) {
    navigate(target.dataset.route);
    return;
  }

  const action = target.dataset.action;

  if (action === "launch-demo") {
    quickSignIn();
    return;
  }

  if (action === "quick-signin") {
    quickSignIn();
    return;
  }

  if (action === "logout") {
    setState((draft) => {
      draft.session.isAuthenticated = false;
      draft.ui.route = "landing";
    }, { silent: true });
    navigate("landing");
    showToast("Signed out", "Your local Swapski demo session has been reset to guest mode.", "success");
    return;
  }

  if (action === "open-request-modal") {
    setState((draft) => {
      draft.ui.requestServiceId = target.dataset.serviceId;
      draft.ui.requestMessage = "";
    });
    return;
  }

  if (action === "close-modal") {
    setState((draft) => {
      draft.ui.requestServiceId = null;
      draft.ui.showCreateService = false;
      draft.ui.requestMessage = "";
    });
    return;
  }

  if (action === "open-create-service") {
    setState((draft) => {
      draft.ui.showCreateService = true;
    });
    return;
  }

  if (action === "reset-filters") {
    setState((draft) => {
      draft.ui.marketplaceSearch = "";
      draft.ui.marketplaceCategory = "All";
    });
    return;
  }

  if (action === "select-category") {
    const category = target.dataset.category || target.closest("[data-category]")?.dataset.category;
    if (category) {
      setState((draft) => {
        draft.ui.marketplaceCategory = category;
      });
    }
    return;
  }

  if (action === "request-status") {
    const requestId = target.dataset.requestId;
    const nextStatus = target.dataset.nextStatus;
    updateRequestStatus(requestId, nextStatus);
    return;
  }

  if (action === "approve-request") {
    approveRequest(target.dataset.requestId);
    return;
  }

  if (action === "request-revision") {
    updateRequestStatus(target.dataset.requestId, "in_progress", "Revision requested. The provider has been asked to make updates.");
    return;
  }

  if (action === "open-conversation") {
    setState((draft) => {
      draft.ui.activeInboxRequestId = target.dataset.conversationId;
      draft.ui.route = "messages";
    }, { silent: true });
    navigate("messages");
    return;
  }

  if (action === "toggle-setting") {
    const key = target.dataset.setting;
    setState((draft) => {
      draft.preferences[key] = !draft.preferences[key];
    });
    showToast("Preference saved", `Updated ${humanizeKey(key)}.`, "success");
  }
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;

  if (form.id === "auth-form") {
    quickSignIn();
    return;
  }

  if (form.id === "onboarding-form") {
    const formData = new FormData(form);
    setState((draft) => {
      const user = draft.users.find((item) => item.id === draft.session.currentUserId);
      user.headline = String(formData.get("headline") || user.headline);
      user.timezone = String(formData.get("timezone") || user.timezone);
      user.location = String(formData.get("location") || user.location);
      user.bio = String(formData.get("bio") || user.bio);
      user.skillsOffered = selectedSkillChips("offered");
      user.skillsWanted = selectedSkillChips("wanted");
      draft.session.onboardingComplete = true;
      draft.session.isAuthenticated = true;
      draft.ui.route = "dashboard";
    }, { silent: true });
    navigate("dashboard");
    showToast("Profile ready", "Your Swapski identity is live. Start earning or requesting help.", "success");
    return;
  }

  if (form.id === "request-service-form") {
    const formData = new FormData(form);
    createRequest(String(formData.get("serviceId")), String(formData.get("message")));
    return;
  }

  if (form.id === "create-service-form") {
    const formData = new FormData(form);
    setState((draft) => {
      draft.services.unshift({
        id: makeId("svc"),
        userId: draft.session.currentUserId,
        title: String(formData.get("title")),
        category: String(formData.get("category")),
        description: String(formData.get("description")),
        creditCost: Number(formData.get("creditCost")),
        deliveryTime: String(formData.get("deliveryTime")),
        revisions: 1,
        featured: false,
        tags: String(formData.get("tags"))
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        image: artwork.marketplace,
      });
      draft.ui.showCreateService = false;
    });
    showToast("Service created", "Your new service is now visible in the marketplace.", "success");
    return;
  }

  if (form.id === "message-form") {
    const formData = new FormData(form);
    const requestId = String(formData.get("requestId"));
    const body = String(formData.get("message")).trim();
    if (!body) return;
    setState((draft) => {
      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: draft.session.currentUserId,
        body,
        createdAt: new Date().toISOString(),
      });
    });
    form.reset();
    showToast("Message sent", "Your task update has been added to the conversation.", "success");
  }
}

function handleInput(event) {
  const target = event.target;
  if (target.name === "marketplaceSearch") {
    setState((draft) => {
      draft.ui.marketplaceSearch = target.value;
    });
  }
  if (target.name === "message" && target.id === "request-message") {
    setState((draft) => {
      draft.ui.requestMessage = target.value;
    }, { silent: true });
  }
}

function handleChange(event) {
  const target = event.target;
  if (target.name === "marketplaceCategory") {
    setState((draft) => {
      draft.ui.marketplaceCategory = target.value;
    });
  }
}

function quickSignIn() {
  setState((draft) => {
    draft.session.isAuthenticated = true;
    draft.ui.route = draft.session.onboardingComplete ? "dashboard" : "onboarding";
  }, { silent: true });
  navigate(state.session.onboardingComplete ? "dashboard" : "onboarding");
  showToast("Demo launched", "You are now in the interactive Swapski experience.", "success");
}

function createRequest(serviceId, message) {
  const service = state.services.find((item) => item.id === serviceId);
  const currentUser = getCurrentUser();
  if (!service) return;

  const wallet = getWalletMetrics(currentUser.id);
  if (wallet.available < service.creditCost) {
    showToast("Not enough credits", "Complete another task or free escrowed credits before requesting this service.", "error");
    return;
  }

  const requestId = makeId("req");
  const otherUser = getUser(service.userId);
  const lockEntryId = makeId("led");

  setState((draft) => {
    draft.requests.unshift({
      id: requestId,
      serviceId: service.id,
      requesterId: currentUser.id,
      providerId: service.userId,
      status: "requested",
      creditAmount: service.creditCost,
      createdAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
      summary: message || `New request for ${service.title}`,
    });
    draft.ledger.unshift({
      id: lockEntryId,
      userId: currentUser.id,
      requestId,
      type: "lock",
      direction: "hold",
      amount: service.creditCost,
      status: "pending",
      createdAt: new Date().toISOString(),
      description: `Credits locked in escrow for ${service.title}`,
    });
    draft.messages.push({
      id: makeId("msg"),
      requestId,
      senderId: "system",
      body: `Escrow confirmed. ${service.creditCost} Swap Credits are locked and ready once delivery is approved.`,
      createdAt: new Date().toISOString(),
    });
    draft.messages.push({
      id: makeId("msg"),
      requestId,
      senderId: currentUser.id,
      body: message,
      createdAt: new Date().toISOString(),
    });
    draft.ui.requestServiceId = null;
    draft.ui.requestMessage = "";
    draft.ui.route = "requests";
    draft.ui.activeInboxRequestId = requestId;
    draft.notifications.unshift({
      id: makeId("note"),
      title: "Request sent",
      body: `Your request is now waiting for ${otherUser.name} to accept.`,
      kind: "success",
    });
  }, { silent: true });

  navigate("requests");
  showToast("Request created", "Credits were locked in escrow and the request thread is now live.", "success");
}

function updateRequestStatus(requestId, nextStatus, successMessage) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;

  const systemMessages = {
    accepted: "Request accepted. Work is now officially in progress.",
    in_progress: "The request moved back into progress for another delivery pass.",
    review: "Delivery submitted. The requester can now approve or request changes.",
    completed: "Request completed and archived.",
  };

  setState((draft) => {
    const requestDraft = draft.requests.find((item) => item.id === requestId);
    requestDraft.status = nextStatus;
    draft.messages.push({
      id: makeId("msg"),
      requestId,
      senderId: "system",
      body: systemMessages[nextStatus] || `Status updated to ${nextStatus}.`,
      createdAt: new Date().toISOString(),
    });
  });

  showToast("Status updated", successMessage || `Request moved to ${prettyStatus(nextStatus)}.`, "success");
}

function approveRequest(requestId) {
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;
  const service = state.services.find((item) => item.id === request.serviceId);
  const provider = getUser(request.providerId);

  setState((draft) => {
    const requestDraft = draft.requests.find((item) => item.id === requestId);
    requestDraft.status = "completed";

    const lockEntry = draft.ledger.find((entry) => entry.requestId === requestId && entry.type === "lock");
    if (lockEntry) {
      lockEntry.status = "completed";
    }

    draft.ledger.unshift({
      id: makeId("led"),
      userId: request.requesterId,
      requestId,
      type: "release",
      direction: "out",
      amount: request.creditAmount,
      status: "completed",
      createdAt: new Date().toISOString(),
      description: `Released credits after approving ${service?.title || "service"}`,
    });
    draft.ledger.unshift({
      id: makeId("led"),
      userId: request.providerId,
      requestId,
      type: "earn",
      direction: "in",
      amount: request.creditAmount,
      status: "completed",
      createdAt: new Date().toISOString(),
      description: `Earned credits from ${service?.title || "approved service"}`,
    });
    draft.messages.push({
      id: makeId("msg"),
      requestId,
      senderId: "system",
      body: `Approval complete. ${request.creditAmount} Swap Credits have been released to ${provider.name}.`,
      createdAt: new Date().toISOString(),
    });
    draft.reviews.unshift({
      id: makeId("rev"),
      authorId: request.requesterId,
      subjectId: request.providerId,
      score: 5,
      review: `${provider.name} delivered clearly and on time. Great communication throughout the swap.`,
    });
  });

  showToast("Credits released", "Approval is complete and the ledger updated on both sides.", "success");
}

function selectedSkillChips(group) {
  return Array.from(document.querySelectorAll(`[data-skill-group="${group}"].active`)).map((item) => item.dataset.skill);
}

function getCurrentUser() {
  return getUser(state.session.currentUserId);
}

function getUser(id) {
  return state.users.find((item) => item.id === id);
}

function getService(id) {
  return state.services.find((item) => item.id === id);
}

function getWalletMetrics(userId) {
  const entries = state.ledger.filter((entry) => entry.userId === userId);
  const earned = sum(entries.filter((entry) => entry.direction === "in" && entry.status === "completed").map((entry) => entry.amount));
  const spent = sum(entries.filter((entry) => entry.direction === "out" && entry.status === "completed").map((entry) => entry.amount));
  const escrow = sum(entries.filter((entry) => entry.type === "lock" && entry.status === "pending").map((entry) => entry.amount));
  const available = earned - spent - escrow;
  return { earned, spent, escrow, available };
}

function getVisibleServices() {
  const search = state.ui.marketplaceSearch.trim().toLowerCase();
  return state.services.filter((service) => {
    const owner = getUser(service.userId);
    const matchesCategory = state.ui.marketplaceCategory === "All" || service.category === state.ui.marketplaceCategory;
    const matchesSearch =
      !search ||
      service.title.toLowerCase().includes(search) ||
      service.tags.some((tag) => tag.toLowerCase().includes(search)) ||
      owner.name.toLowerCase().includes(search) ||
      owner.handle.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });
}

function getRequestsForUser(userId) {
  return state.requests
    .filter((request) => request.requesterId === userId || request.providerId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getReviewsForUser(userId) {
  return state.reviews.filter((review) => review.subjectId === userId);
}

function getConversationSummaries() {
  return getRequestsForUser(getCurrentUser().id).map((request) => {
    const service = getService(request.serviceId);
    const partnerId = request.requesterId === getCurrentUser().id ? request.providerId : request.requesterId;
    const partner = getUser(partnerId);
    const messages = state.messages
      .filter((message) => message.requestId === request.id)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    return {
      request,
      service,
      partner,
      messages,
      lastMessage: messages[messages.length - 1],
    };
  });
}

function metricCard(value, label) {
  const isPlainNumber = /^-?\d+(\.\d+)?$/.test(String(value).replace(/,/g, ""));
  return `
    <div class="metric-card">
      <strong ${isPlainNumber ? `class="counter" data-count="${extractNumeric(value)}"` : ""}>${value}</strong>
      <span>${label}</span>
    </div>
  `;
}

function dashboardStat(label, value, icon) {
  return `
    <div class="mini-stat">
      <div class="card-header-row">
        <span class="muted">${label}</span>
        <div class="icon-bubble"><i class="bi ${icon}"></i></div>
      </div>
      <strong class="mt-3">${value}</strong>
    </div>
  `;
}

function activityRow(icon, title, body) {
  return `
    <div class="activity-item">
      <div class="icon-bubble"><i class="bi ${icon}"></i></div>
      <div>
        <strong>${title}</strong>
        <div class="muted">${body}</div>
      </div>
    </div>
  `;
}

function chip(label) {
  return `<span class="category-chip">${label}</span>`;
}

function storyStep(number, title, body) {
  return `
    <article class="story-card">
      <div class="badge-soft mb-3">${number}</div>
      <h3>${title}</h3>
      <p class="muted mb-0">${body}</p>
    </article>
  `;
}

function renderLandingServiceCard(service) {
  const user = getUser(service.userId);
  return `
    <article class="testimonial-card">
      <div class="service-visual mb-3">
        <img src="${service.image}" alt="${service.title}" />
      </div>
      <div class="chip-row mb-3">
        <span class="badge-soft">${service.category}</span>
        <span class="badge-soft">${formatCredits(service.creditCost)}</span>
      </div>
      <h3>${service.title}</h3>
      <p class="muted">${service.description}</p>
      <div class="card-header-row">
        <span class="muted">${user.name}</span>
        <span class="badge-soft">${user.rating.toFixed(1)} rating</span>
      </div>
    </article>
  `;
}

function renderTestimonial(user) {
  return `
    <article class="testimonial-card">
      <div class="card-header-row">
        <div class="avatar-ring">${user.avatar}</div>
        <span class="badge-soft">${user.trustScore} trust</span>
      </div>
      <h3 class="mt-3">${user.name}</h3>
      <p class="muted">${user.headline}</p>
      <div class="chip-row mt-3">
        ${user.skillsOffered.slice(0, 3).map(chip).join("")}
      </div>
    </article>
  `;
}

function faqCard(title, body) {
  return `
    <article class="faq-card">
      <h3>${title}</h3>
      <p class="muted mb-0">${body}</p>
    </article>
  `;
}

function renderServiceCard(service, currentUserId) {
  const owner = getUser(service.userId);
  const selfOwned = currentUserId === service.userId;
  return `
    <article class="service-card">
      <div class="service-visual">
        <img src="${service.image}" alt="${service.title}" />
      </div>
      <div class="chip-row">
        <span class="badge-soft">${service.category}</span>
        ${service.featured ? "<span class='badge-soft'>Featured</span>" : ""}
      </div>
      <div>
        <h3>${service.title}</h3>
        <p class="muted">${service.description}</p>
      </div>
      <div class="chip-row">
        ${service.tags.map(chip).join("")}
      </div>
      <div class="service-footer">
        <div>
          <div class="service-meta">${owner.name} • ${owner.rating.toFixed(1)} rating</div>
          <strong>${formatCredits(service.creditCost)}</strong>
        </div>
        <div class="inline-actions">
          <span class="badge-soft">${service.deliveryTime}</span>
          <button class="btn-gradient" data-action="open-request-modal" data-service-id="${service.id}" ${selfOwned ? "disabled" : ""}>
            ${selfOwned ? "Your service" : "Request"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function compactService(service, selfOwned = false) {
  const user = getUser(service.userId);
  return `
    <article class="service-card">
      <div class="card-header-row">
        <div>
          <strong>${service.title}</strong>
          <div class="muted">${selfOwned ? "Published by you" : `By ${user.name}`}</div>
        </div>
        <span class="badge-soft">${formatCredits(service.creditCost)}</span>
      </div>
      <div class="chip-row mt-3">
        ${service.tags.map(chip).join("")}
      </div>
      <div class="inline-actions mt-3">
        <span class="badge-soft">${service.deliveryTime}</span>
        ${!selfOwned ? `<button class="btn-outline-soft" data-action="open-request-modal" data-service-id="${service.id}">Request</button>` : ""}
      </div>
    </article>
  `;
}

function requestSummaryCard(request) {
  const service = getService(request.serviceId);
  const partnerId = request.requesterId === getCurrentUser().id ? request.providerId : request.requesterId;
  const partner = getUser(partnerId);
  return `
    <div class="timeline-card">
      <div class="card-header-row">
        <strong>${service?.title || "Service request"}</strong>
        <span class="status-chip ${request.status}">${prettyStatus(request.status)}</span>
      </div>
      <div class="muted mt-2">${partner.name} • due ${formatDate(request.dueAt)}</div>
      <div class="inline-actions mt-3">
        <button class="btn-outline-soft" data-action="open-conversation" data-conversation-id="${request.id}">Chat</button>
        <button class="btn-outline-soft" data-route="requests">View flow</button>
      </div>
    </div>
  `;
}

function requestWorkflowCard(request) {
  const currentUser = getCurrentUser();
  const service = getService(request.serviceId);
  const partnerId = request.requesterId === currentUser.id ? request.providerId : request.requesterId;
  const partner = getUser(partnerId);
  const isRequester = request.requesterId === currentUser.id;
  const timeline = ["requested", "accepted", "in_progress", "review", "completed"];
  const statusIndex = timeline.indexOf(request.status);

  return `
    <article class="timeline-card">
      <div class="card-header-row">
        <div>
          <div class="eyebrow">${isRequester ? "You requested" : "You are providing"}</div>
          <h3 class="mt-3 mb-1">${service?.title || "Service request"}</h3>
        </div>
        <span class="status-chip ${request.status}">${prettyStatus(request.status)}</span>
      </div>
      <p class="muted mt-3">${request.summary}</p>
      <div class="chip-row mb-3">
        <span class="badge-soft">${formatCredits(request.creditAmount)}</span>
        <span class="badge-soft">Partner: ${partner.name}</span>
        <span class="badge-soft">Due ${formatDate(request.dueAt)}</span>
      </div>
      <div class="timeline-list">
        ${timeline
          .map(
            (status, index) => `
              <div class="timeline-row">
                <div class="timeline-marker ${index <= statusIndex ? "active" : ""}"></div>
                <div>
                  <strong>${prettyStatus(status)}</strong>
                  <div class="timeline-copy">${timelineCopy(status)}</div>
                </div>
              </div>
            `
          )
          .join("")}
      </div>
      <div class="inline-actions mt-4">
        ${renderRequestActions(request, isRequester)}
        <button class="btn-outline-soft" data-action="open-conversation" data-conversation-id="${request.id}">Open chat</button>
      </div>
    </article>
  `;
}

function renderRequestActions(request, isRequester) {
  if (request.status === "requested" && !isRequester) {
    return `<button class="btn-gradient" data-action="request-status" data-request-id="${request.id}" data-next-status="accepted">Accept request</button>`;
  }
  if (request.status === "accepted" && !isRequester) {
    return `<button class="btn-gradient" data-action="request-status" data-request-id="${request.id}" data-next-status="in_progress">Start work</button>`;
  }
  if (request.status === "in_progress" && !isRequester) {
    return `<button class="btn-gradient" data-action="request-status" data-request-id="${request.id}" data-next-status="review">Mark delivered</button>`;
  }
  if (request.status === "review" && isRequester) {
    return `
      <button class="btn-gradient" data-action="approve-request" data-request-id="${request.id}">Approve and release</button>
      <button class="btn-ghost" data-action="request-revision" data-request-id="${request.id}">Request changes</button>
    `;
  }
  if (request.status === "completed") {
    return `<span class="badge-soft">Credits released</span>`;
  }
  return `<span class="badge-soft">Awaiting next step</span>`;
}

function walletBar(label, value, total, width) {
  return `
    <div class="wallet-bar">
      <div class="card-header-row">
        <span>${label}</span>
        <strong>${formatCredits(value)}</strong>
      </div>
      <div class="wallet-bar-track">
        <span style="width:${Math.min(100, Math.max(6, parseFloat(width) || (value / Math.max(total, 1)) * 100))}%"></span>
      </div>
    </div>
  `;
}

function ledgerRow(entry) {
  const statusLabel = entry.status === "pending" ? "Escrowed" : "Completed";
  return `
    <div class="ledger-row">
      <div class="icon-bubble"><i class="bi ${ledgerIcon(entry.type)}"></i></div>
      <div class="flex-grow-1">
        <strong>${humanizeKey(entry.type)}</strong>
        <div class="ledger-meta">${entry.description}</div>
      </div>
      <div class="text-end">
        <strong>${entry.direction === "out" ? "-" : ""}${formatCredits(entry.amount)}</strong>
        <div class="ledger-meta">${statusLabel} • ${formatDate(entry.createdAt)}</div>
      </div>
    </div>
  `;
}

function renderConversationRow(summary, active) {
  return `
    <div class="conversation-row ${active ? "active" : ""}" data-action="open-conversation" data-conversation-id="${summary.request.id}">
      <div class="avatar-ring">${summary.partner.avatar}</div>
      <div class="flex-grow-1">
        <strong>${summary.partner.name}</strong>
        <div class="conversation-meta">${summary.service?.title || "Service request"}</div>
      </div>
      <span class="status-chip ${summary.request.status}">${prettyStatus(summary.request.status)}</span>
    </div>
  `;
}

function renderConversationPanel(summary) {
  return `
    <div class="card-header-row">
      <div>
        <div class="eyebrow">${summary.partner.name}</div>
        <h3 class="mt-3 mb-1">${summary.service?.title || "Conversation"}</h3>
      </div>
      <span class="status-chip ${summary.request.status}">${prettyStatus(summary.request.status)}</span>
    </div>
    <p class="muted mt-3">Credits locked: ${formatCredits(summary.request.creditAmount)} • due ${formatDate(summary.request.dueAt)}</p>
    <div class="message-list mt-4">
      ${summary.messages
        .map((message) => {
          if (message.senderId === "system") {
            return `<div class="system-bubble">${message.body}</div>`;
          }
          const mine = message.senderId === getCurrentUser().id;
          return `
            <div class="message-bubble ${mine ? "mine" : "other"}">
              <strong>${mine ? "You" : summary.partner.name}</strong>
              <div>${message.body}</div>
              <div class="small-note mt-2">${formatDate(message.createdAt)}</div>
            </div>
          `;
        })
        .join("")}
    </div>
    <form id="message-form" class="mt-3">
      <input type="hidden" name="requestId" value="${summary.request.id}" />
      <div class="row g-3 align-items-end">
        <div class="col-md-9">
          <label class="form-label" for="message-${summary.request.id}">Add update</label>
          <input class="form-control" id="message-${summary.request.id}" name="message" placeholder="Share delivery progress, files, or feedback..." />
        </div>
        <div class="col-md-3 d-grid">
          <button class="btn-gradient" type="submit">Send</button>
        </div>
      </div>
    </form>
  `;
}

function taskCard(request) {
  const service = getService(request.serviceId);
  const partnerId = request.requesterId === getCurrentUser().id ? request.providerId : request.requesterId;
  const partner = getUser(partnerId);
  return `
    <article class="task-card">
      <strong>${service?.title || "Service request"}</strong>
      <div class="muted mt-2">${partner.name} • ${formatCredits(request.creditAmount)}</div>
      <div class="inline-actions mt-3">
        <span class="status-chip ${request.status}">${prettyStatus(request.status)}</span>
        <button class="btn-outline-soft" data-action="open-conversation" data-conversation-id="${request.id}">Chat</button>
      </div>
    </article>
  `;
}

function renderReview(review) {
  const author = getUser(review.authorId);
  return `
    <div class="review-row">
      <div class="avatar-ring">${author.avatar}</div>
      <div>
        <strong>${author.name}</strong>
        <div class="muted">${"★".repeat(review.score)}${"☆".repeat(5 - review.score)}</div>
        <div class="muted">${review.review}</div>
      </div>
    </div>
  `;
}

function renderBrand(tagline) {
  return `
    <div class="brand-lockup">
      <img src="./SWAP.png" alt="Swapski Logo" class="swapski-logo-img" />
      <div class="brand-text">
        <strong>SWAPSKI</strong>
        ${tagline ? `<span>${tagline}</span>` : ""}
      </div>
    </div>
  `;
}

function navLink(route, label, icon) {
  const active = state.ui.route === route ? "active" : "";
  return `
    <button class="side-link ${active}" data-route="${route}">
      <span><i class="bi ${icon} me-2"></i>${label}</span>
      <i class="bi bi-chevron-right"></i>
    </button>
  `;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav d-md-none">
      <button class="bottom-link ${state.ui.route === "dashboard" ? "active" : ""}" data-route="dashboard">Home</button>
      <button class="bottom-link ${state.ui.route === "marketplace" ? "active" : ""}" data-route="marketplace">Market</button>
      <button class="bottom-link ${state.ui.route === "requests" ? "active" : ""}" data-route="requests">Requests</button>
      <button class="bottom-link ${state.ui.route === "messages" ? "active" : ""}" data-route="messages">Chat</button>
    </nav>
  `;
}

function switchControl(setting, active) {
  return `<button class="switch ${active ? "active" : ""}" data-action="toggle-setting" data-setting="${setting}" aria-label="Toggle ${setting}"></button>`;
}

function skillToggle(skill, active, group) {
  return `<button type="button" class="skill-chip ${active ? "active" : ""}" data-skill="${skill}" data-skill-group="${group}" onclick="this.classList.toggle('active')">${skill}</button>`;
}

function prettyStatus(status) {
  const labels = {
    requested: "Requested",
    accepted: "Accepted",
    in_progress: "In Progress",
    review: "In Review",
    completed: "Completed",
    disputed: "Disputed",
  };
  return labels[status] || status;
}

function timelineCopy(status) {
  const copy = {
    requested: "Request created and waiting for provider response.",
    accepted: "Provider accepted the request and committed to the swap.",
    in_progress: "Task work is actively underway.",
    review: "Delivery submitted and waiting for requester review.",
    completed: "Credits released and the swap archived.",
  };
  return copy[status] || "";
}

function ledgerIcon(type) {
  const icons = {
    earn: "bi-arrow-down-circle",
    lock: "bi-shield-lock",
    release: "bi-arrow-up-circle",
    refund: "bi-arrow-return-left",
    adjustment: "bi-sliders2",
  };
  return icons[type] || "bi-dot";
}

function formatCredits(value) {
  return `${Number(value).toLocaleString()} credits`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function showToast(title, body, kind = "success") {
  const node = document.createElement("div");
  node.className = `toast-card ${kind}`;
  node.innerHTML = `<strong>${title}</strong><div class="muted mt-1">${body}</div>`;
  toastStack.appendChild(node);
  setTimeout(() => {
    node.remove();
  }, 3200);
}

function humanizeKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sum(values) {
  return values.reduce((total, value) => total + Number(value || 0), 0);
}

function extractNumeric(value) {
  const match = String(value).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function animateCounters() {
  document.querySelectorAll(".counter[data-count]").forEach((element) => {
    if (element.dataset.animated === "true") return;
    const target = Number(element.dataset.count);
    if (!target || state.preferences.reducedMotion) {
      element.dataset.animated = "true";
      return;
    }
    let start = 0;
    const duration = 900;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const current = Math.round(start + (target - start) * progress);
      element.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        element.textContent = String(target).includes(".") ? target.toFixed(1) : current.toLocaleString();
        element.dataset.animated = "true";
      }
    };

    requestAnimationFrame(tick);
  });
}

function triggerRipple(target) {
  if (!(target instanceof HTMLElement) || !target.classList.contains("btn-gradient") && !target.classList.contains("btn-ghost") && !target.classList.contains("btn-outline-soft")) {
    return;
  }
  target.classList.remove("btn-ripple");
  window.requestAnimationFrame(() => {
    target.classList.add("btn-ripple");
    setTimeout(() => target.classList.remove("btn-ripple"), 420);
  });
}

function applyMotionPreference() {
  document.documentElement.style.scrollBehavior = state.preferences.reducedMotion ? "auto" : "smooth";
}
