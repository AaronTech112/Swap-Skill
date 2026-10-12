const { artwork, initialState, skillLibrary } = window.SWAPSKI_DATA || {};

if (!artwork || !initialState || !skillLibrary) {
  throw new Error("Swapski data failed to load. Make sure data.js is loaded before app.js.");
}

const app = document.getElementById("app");
const modalRoot = document.getElementById("modal-root");
const toastStack = document.getElementById("toast-stack");
const STORAGE_KEY = "swapski-spa-state-v1";

const THEME_KEY = "swapski-theme";

const PROGRESS_PHASES = [
  { key: "discover", label: "Discover", icon: "bi-binoculars" },
  { key: "accept", label: "Accept", icon: "bi-check-circle" },
  { key: "brief", label: "AI Brief", icon: "bi-lightbulb" },
  { key: "chat", label: "Chat", icon: "bi-chat-dots" },
  { key: "work", label: "Work", icon: "bi-folder2-open" },
  { key: "submit", label: "Submit", icon: "bi-send" },
  { key: "review", label: "AI Review", icon: "bi-eye" },
  { key: "release", label: "Escrow", icon: "bi-shield-lock" },
  { key: "earn", label: "Credits", icon: "bi-lightning-charge" },
  { key: "review_given", label: "Review", icon: "bi-star" },
  { key: "done", label: "Complete", icon: "bi-trophy" },
];

const AI_PERSONAE = {
  user_2: {
    name: "Chidi",
    tone: "pragmatic, clear, engineering-minded",
    signoff: "— Chidi",
  },
  user_3: {
    name: "Farida",
    tone: "structured, research-focused, precise",
    signoff: "— Farida",
  },
  user_4: {
    name: "Tunde",
    tone: "energetic, visual, story-driven",
    signoff: "— Tunde",
  },
};

const TASK_BRIEFS = {
  Development: {
    scope: `Build a responsive single-page experience with:
• Hero section with strong value-propaganda headline, 2 CTAs, trust metrics row
• 3-column feature grid with icons + short copy
• Testimonial strip with 3 reviews
• Pricing section (3 tiers, middle highlighted)
• FAQ accordion (6 questions)
• Footer with brand, socials, newsletter, legal links

The page must work cleanly on mobile (≤ 375px), tablet (768px), and desktop (≥ 1280px).`,
    goals: [
      "Ship semantic HTML with accessible ARIA labels",
      "Reusable CSS component classes",
      "Pixel-match the reference art direction",
      "Pass Lighthouse performance ≥ 90",
    ],
    milestones: [
      "Day 1: Structure (hero + nav + feature grid) complete",
      "Day 2: Pricing, FAQ, and footer layout",
      "Day 3: Responsive polish, interaction states, final review",
    ],
    refs: ["https://www.figma.com/file/swapski-dev-landing-v2", "https://getbootstrap.com/docs/5.3/layout/grid/", "https://example.com/swapski-brand-assets-v1.zip"],
    attachments: [
      { fileName: "swapski_brand_guidelines.pdf", fileSize: 1422000, fileType: "application/pdf" },
      { fileName: "hero_photography_reference.jpg", fileSize: 890000, fileType: "image/jpeg" },
    ],
  },
  Research: {
    scope: `Market and competitor scan for a skill-exchange SaaS startup:
• Segment analysis: creators, solopreneurs, agency teams, students
• Competitor matrix: 6 comparable products, pricing, moats, gaps
• Interview themes from 8 prospects
• Demand keywords with search volume
• Risks and assumptions log`,
    goals: [
      "Produce a shareable Notion doc with structured findings",
      "Highlight 3 highest-potential opportunities to pursue",
      "Surface concrete objections with verbatim quotes",
    ],
    milestones: [
      "Day 1: Desk research, competitor matrix, keyword pull",
      "Day 2: Interview synthesis, opportunity map, recommendation",
    ],
    refs: ["https://www.notion.so/swapski-research-template-2026", "https://example.com/swapski-customer-interview-notes", "https://example.com/ahrefs-skill-keywords.csv"],
    attachments: [
      { fileName: "market_keywords_2026_q3.csv", fileSize: 62000, fileType: "text/csv" },
    ],
  },
  Creative: {
    scope: `60-second vertical + 15-second cut launch teaser:
• 0s–6s: Hook — scroll-stopping visual with single-word logo reveal
• 6s–32s: Problem → Solution — 3 product UI vignettes
• 32s–50s: Proof — customer logos, 5-star snippet, social proof
• 50s–60s: CTA — "Join free" + QR + URL end card

Deliverables: MP4 (1920×1080) & MP4 (1080×1920), SRT captions, Thumbnail JPG.`,
    goals: [
      "Hook score ≥ 60% at 3 seconds (industry benchmark)",
      "Caption-ready narrative in 120 words",
      "On-brand palette + typography",
    ],
    milestones: [
      "Day 1: Mood board, storyboard, shot list approved",
      "Day 2–3: Animation production + music draft",
      "Day 4: 15s cut + captions + thumbnail",
    ],
    refs: ["https://www.figma.com/file/swapski-launch-teaser-storyboard-v1", "https://example.com/swapski-brand-guidelines-video", "https://youtu.be/swapski-reference-ads"],
    attachments: [
      { fileName: "swapski_voiceover_script.docx", fileSize: 28000, fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
      { fileName: "swapski_logo_master_black_white.ai", fileSize: 1140000, fileType: "application/postscript" },
    ],
  },
  Design: {
    scope: `Full UI/UX audit for a SaaS dashboard product:
• Screens: login, onboarding, dashboard, drill-down, settings
• Heat of 100 highest-pain points ranked by user effort (0–10)
• Redesign suggestions with 2–3 Figma mock-ups per major screen
• Typography, color, spacing, and iconography system pass`,
    goals: [
      "Reduce primary user-journey step count by 25%",
      "Create a reusable spacing scale + token palette",
      "Deliver annotated Figma file that dev team can implement directly",
    ],
    milestones: [
      "Audit + pain log complete by end of Day 1",
      "Day 2: Redesign system screens + component library",
    ],
    refs: ["https://www.figma.com/file/swapski-saas-audit-live", "https://example.com/swapski-session-recordings-mixpanel", "https://example.com/swapski-nps-comments-q2.csv"],
    attachments: [
      { fileName: "swapski_audit_user_quotes.md", fileSize: 14000, fileType: "text/markdown" },
    ],
  },
  Strategy: {
    scope: `Go-to-market plan for launch month 1:
• Audience definition + primary ICPs (3)
• Channels with budget and weekly cadence
• Launch narrative in 3 elevations (tweet, landing, press)
• 4-week content calendar + launch event plan
• KPI targets + leading indicators`,
    goals: [
      "Drive ≥ 500 signups month 1",
      "Seed 30 community swap listings organically",
      "Land ≥ 4 targeted press mentions",
    ],
    milestones: [
      "Week 1: Strategy, story, ICPs, budget confirmed",
      "Week 2: Assets + influencer briefings done",
      "Week 3: Pre-launch + launch event execution",
      "Week 4: Retrospective + scaling recommendations",
    ],
    refs: ["https://www.notion.so/swapski-gtm-playbook-2026", "https://example.com/swapski-launch-kit-v1", "https://airtable.com/swapski-press-targets"],
    attachments: [
      { fileName: "swapski_launch_PR.docx", fileSize: 32000, fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
    ],
  },
};

const REVIEW_TEMPLATES = [
  "Incredibly responsive — turned rough notes into something I can actually ship. Clear communication throughout and went the extra mile on small polish details.",
  "Delivery was ahead of schedule and the handoff was clean. Scope was respected, revisions were fast, and the final output matches what I had in mind — great collaborator.",
  "High signal, no fluff. Deliverables were structured and easy to share with stakeholders. Already planning the next swap with them.",
  "Strong instincts, great questions up front, and the final work shows the difference between 'checking boxes' and actually caring about the outcome.",
  "Consistent updates, thoughtful revision notes, and every deadline beat. Zero friction — will absolutely swap again.",
];

const DEMO_TOUR_STEPS = [
  {
    title: "Step 1 · Understand your dashboard",
    body: "This is Amaka — your demo persona. The overview shows your available credits, active tasks, and requests. The Credit Summary on the right side of the Marketplace page also shows escrow vs. available.",
    cta: "Got it, show me the Marketplace",
  },
  {
    title: "Step 2 · Browse the Marketplace & accept a task",
    body: "Cards are posted by other Swapski users (Chidi, Farida, Tunde). Each lists a service they need done + credit cost. Click I can deliver — their credits lock into escrow, and you act as the Provider doing the work. Chidi/Farida/Tunde auto-reply in ~2s with a full brief, references, and project files.",
    cta: "Next: see Tasks board",
  },
  {
    title: "Step 3 · Workflow: Kanban & start work",
    body: "Accepted tasks move to Accepted → click Start Work to move it to In progress. The card shows the partner name, escrowed credits, and the latest delivery snapshot if any. AI posters usually share task details within 2 seconds.",
    cta: "Next: Chat & delivery",
  },
  {
    title: "Step 4 · Chat, then Submit delivery",
    body: "Open any conversation from Messages (or click the task). You'll receive full project details + reference links + attachments from the AI poster. When ready: click Submit delivery → paste a link, attach a file, write a note → move to Review. Chidi/Farida/Tunde review in ~3s, sometimes request 1 small revision, then approve & release escrow + leave a 5-star review.",
    cta: "Next: your Profile & proof of work",
  },
  {
    title: "Step 5 · Profile, reputation & earning reviews",
    body: "After approval, credits arrive in your available balance, completedSwaps + 1, trust score rises, and a 5-star review appears on your profile. Try the full loop now: Go to Marketplace → pick any service → Accept Offer → read the AI brief → Submit delivery (fake link works!) → wait for AI approval → come back here to see reviews & balance update.",
    cta: "Start the full loop! 🚀",
  },
];

function applyTheme(theme, saveToStorage = false) {
  const root = document.documentElement;
  const safe = theme === "light" ? "light" : "dark";
  if (safe === "light") {
    root.setAttribute("data-theme", "light");
  } else {
    root.removeAttribute("data-theme");
  }
  const metaDark = document.querySelector('meta[name="theme-color"][media*="dark"]');
  const metaLight = document.querySelector('meta[name="theme-color"][media*="light"]');
  if (metaDark) metaDark.setAttribute("content", safe === "dark" ? "#050816" : "#f6f8ff");
  if (metaLight) metaLight.setAttribute("content", safe === "light" ? "#f6f8ff" : "#050816");
  if (saveToStorage) {
    try { localStorage.setItem(THEME_KEY, safe); } catch {}
  }
}

function detectInitialTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  } catch {}
  return "dark";
}

let state = hydrateState();
try {
  if (!state.preferences.theme) state.preferences.theme = detectInitialTheme();
  applyTheme(state.preferences.theme, true);
} catch {}

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
  const baseUsersById = new Map((base.users || []).map((u) => [u.id, u]));
  const patchUsers = Array.isArray(patch.users) ? patch.users : [];
  const mergedUsers = [];
  const seenIds = new Set();
  patchUsers.forEach((pu) => {
    const baseUser = baseUsersById.get(pu.id);
    if (baseUser) {
      mergedUsers.push({ ...baseUser, ...pu });
    } else {
      mergedUsers.push(pu);
    }
    seenIds.add(pu.id);
  });
  (base.users || []).forEach((bu) => {
    if (!seenIds.has(bu.id)) mergedUsers.push(bu);
  });

  const mergedServices = Array.isArray(patch.services) && patch.services.length
    ? patch.services
    : (base.services || []);

  return {
    ...clone(base),
    ...patch,
    session: { ...base.session, ...(patch.session || {}) },
    ui: { ...base.ui, ...(patch.ui || {}) },
    preferences: { ...base.preferences, ...(patch.preferences || {}) },
    users: mergedUsers,
    services: mergedServices,
    notifications: Array.isArray(patch.notifications) ? patch.notifications : (base.notifications || []),
    requests: Array.isArray(patch.requests) ? patch.requests : (base.requests || []),
    ledger: Array.isArray(patch.ledger) ? patch.ledger : (base.ledger || []),
    messages: Array.isArray(patch.messages) ? patch.messages : (base.messages || []),
    reviews: Array.isArray(patch.reviews) ? patch.reviews : (base.reviews || []),
    favorites: Array.isArray(patch.favorites) ? patch.favorites : (base.favorites || []),
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
    "signin",
    "signup",
    "demo-login",
    "auth",
    "onboarding",
    "dashboard",
    "favorites",
    "notifications",
    "marketplace",
    "profile",
    "requests",
    "messages",
    "tasks",
    "settings",
  ];
  if (!routes.includes(route)) return "landing";
  if (!state.session.isAuthenticated && !["landing", "signin", "signup", "demo-login", "auth", "onboarding"].includes(route)) {
    return "signin";
  }
  if (state.session.isAuthenticated && ["signin", "signup", "demo-login", "auth"].includes(route)) {
    return "dashboard";
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
  if (route === "signin") return renderSignIn();
  if (route === "signup") return renderSignUp();
  if (route === "demo-login") return renderDemoLogin();
  if (route === "auth") return renderSignUp();
  if (route === "onboarding") return renderOnboarding();
  return renderLanding();
}

function renderPrivateView(route) {
  const pageMap = {
    dashboard: renderDashboard,
    favorites: renderFavorites,
    notifications: renderNotifications,
    marketplace: renderMarketplace,
    profile: renderProfile,
    requests: renderRequests,
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
            ${navLink("marketplace", "Marketplace", "bi-shop")}
            ${navLink("requests", "Requests", "bi-hourglass-split")}
            ${navLink("messages", "Messages", "bi-chat-left-dots")}
            ${navLink("favorites", "Saved", "bi-heart")}
            ${navLink("tasks", "Tasks", "bi-kanban")}
            ${navLink("notifications", "Alerts", "bi-bell")}
            ${navLink("profile", "Profile", "bi-person-bounding-box")}
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
            <div class="d-flex gap-2 mt-3">
              <button class="theme-toggle flex-grow-1" type="button" data-action="toggle-theme" aria-label="Toggle theme">
                <i class="bi ${state.preferences.theme === "light" ? "bi-moon-stars" : "bi-sun"}"></i>
              </button>
              <button class="btn-ghost flex-grow-1" data-action="logout">Sign out</button>
            </div>
          </div>
        </aside>
        <main class="app-main">
          <div class="glass-card page-shell">
            <div class="app-topbar glass-card-soft">
              <div class="brand-lockup">
                <img src="./SWAP.png" alt="Swapski Logo" class="swapski-logo-img sm" style="cursor:pointer;" data-route="${state.session.isAuthenticated ? "dashboard" : "landing"}" />
                <div class="badge-soft">
                  <i class="bi bi-shield-check text-cyan"></i> Swapski Network
                </div>
              </div>
              <div class="topbar-actions">
                <button class="theme-toggle" type="button" data-action="toggle-theme" aria-label="Toggle theme" title="Toggle ${state.preferences.theme === "light" ? "Dark" : "Light"} mode">
                  <i class="bi ${state.preferences.theme === "light" ? "bi-moon-stars" : "bi-sun"}"></i>
                </button>
                <div class="topbar-pill">
                  <i class="bi bi-bell"></i>
                  <span>${state.notifications.length} alerts</span>
                </div>
                <div class="topbar-pill" title="Demo Simulation · No Real Funds">
                  <i class="bi bi-lightning-charge"></i>
                  <span>${formatCredits(getWalletMetrics(currentUser.id).available)}</span>
                  <span class="demo-badge ms-1" style="padding: 2px 7px; font-size: 0.58rem;">Demo</span>
                </div>
                <button class="btn-gradient" data-route="marketplace">Start a swap</button>
              </div>
            </div>
            ${renderDemoTourBanner()}
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
            <button class="nav-link-chip" data-route="marketplace">Browse marketplace</button>
            <a class="nav-link-chip" href="#market-signal">Marketplace</a>
            <a class="nav-link-chip" href="#trust-layer">Trust layer</a>
            <button class="theme-toggle" type="button" data-action="toggle-theme" aria-label="Toggle theme" title="Toggle ${state.preferences.theme === "light" ? "Dark" : "Light"} mode">
              <i class="bi ${state.preferences.theme === "light" ? "bi-moon-stars" : "bi-sun"}"></i>
            </button>
            <button class="btn-ghost" data-route="signin">Sign in</button>
            <button class="btn-ghost" data-route="signup">Sign up</button>
            <button class="btn-gradient" data-route="demo-login">Launch demo</button>
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
              <button class="btn-gradient" data-route="signup">Get started free</button>
              <button class="btn-ghost" data-route="signin">Sign in</button>
              <button class="btn-outline-soft" data-route="demo-login">Launch demo</button>
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
          <button class="btn-ghost" data-route="marketplace">Explore Marketplace</button>
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

      <section id="faq" class="section-spacing glass-card page-shell">
        <div class="section-header">
          <div>
            <div class="section-kicker">FAQ</div>
            <h2 class="mt-3">Everything you need to know.</h2>
          </div>
        </div>
        <div class="faq-grid">
          ${faqCard("How do Swap Credits work?", "You earn credits by completing tasks for other members, then spend them to receive services. Credits never expire and move through an immutable ledger so every movement is transparent.")}
          ${faqCard("Is escrow actually enforced?", "In the demo, escrow is simulated locally. In production, credits are programmatically locked on request creation and only released when you explicitly approve delivery or a resolution timeline completes.")}
          ${faqCard("What happens if a swap goes wrong?", "Every swap has a dispute placeholder and a human-review escalation path. The trust score factors delivery history, response time, and dispute resolution outcomes.")}
          ${faqCard("Can I join without prior experience?", "Yes. The marketplace values skill over resume. Build your trust history with smaller swaps and the match engine will surface higher-value opportunities over time.")}
          ${faqCard("Do I need to offer a skill to use it?", "New members receive a small sign-up credit grant so they can request their first service before earning. After that, earning credits is what unlocks continued access.")}
          ${faqCard("Is my profile public by default?", "Yes, but you can toggle visibility in Settings. Private profiles participate in private-match mode only, meaning you still receive curated suggestions but do not appear in public Discover searches.")}
        </div>
      </section>

      <section class="section-spacing glass-card page-shell">
        <div class="story-grid">
          <article class="story-card" style="display:grid;place-items:center start;">
            <div class="section-kicker">Ready to swap</div>
            <h2 class="mt-3">Start with the live demo.</h2>
            <p class="muted mt-3">
              Explore a fully-populated demo identity in under 10 seconds — active swaps, wallet ledger, messaging, and the complete request lifecycle ready to click through.
            </p>
            <div class="hero-actions mt-4 mb-0">
              <button class="btn-gradient" data-route="demo-login">Launch demo</button>
              <button class="btn-outline-soft" data-route="signup">Create account</button>
            </div>
          </article>
          <article class="story-card story-image">
            <img src="${artwork.marketplace}" alt="Swapski collaborative marketplace preview" />
          </article>
        </div>
      </section>
    </div>
  `;
}

function renderAuthBrandNav() {
  return `
    <div class="brand-nav glass-card-soft mb-4">
      ${renderBrand("Premium skill exchange, without the price tag.")}
      <div class="nav-links">
        <button class="theme-toggle" type="button" data-action="toggle-theme" aria-label="Toggle theme" title="Toggle ${state.preferences.theme === "light" ? "Dark" : "Light"} mode">
          <i class="bi ${state.preferences.theme === "light" ? "bi-moon-stars" : "bi-sun"}"></i>
        </button>
        <button class="btn-ghost" data-route="landing">Back home</button>
      </div>
    </div>
  `;
}

function renderSignIn() {
  return `
    <div class="auth-shell fade-in">
      <div class="glass-card p-4">
        ${renderAuthBrandNav()}
        <div class="auth-grid">
          <section class="glass-card auth-story p-4">
            <div class="section-kicker">Welcome back</div>
            <h1 class="mt-3 mb-3">Sign in to Swapski.</h1>
            <p class="muted">
              Pick up right where you left off — browse your open swaps, reply to requests, and discover your next skill match.
            </p>
            <div class="hero-image mt-4">
              <img src="${artwork.onboarding}" alt="Swapski onboarding illustration" />
            </div>
            <div class="hero-metrics mt-4">
              ${metricCard("Secure", "Local session demo")}
              ${metricCard("Fast", "One-tap sign-in")}
              ${metricCard("Smart", "Skill-based matches")}
            </div>
          </section>
          <section class="glass-card auth-card">
            <div class="eyebrow">Returning member</div>
            <h2 class="mt-3">Sign In</h2>
            <p class="muted">Enter your credentials to access your dashboard and active skill swaps.</p>
            <form id="signin-form" class="mt-4">
              <div class="mb-3">
                <label class="form-label" for="signin-email">Email</label>
                <input class="form-control" id="signin-email" name="email" type="email" value="" placeholder="you@example.com" required autocomplete="email" />
              </div>
              <div class="mb-3">
                <label class="form-label" for="signin-password">Password</label>
                <div class="input-group password-group">
                  <input class="form-control" id="signin-password" name="password" type="password" value="" placeholder="••••••••" required autocomplete="current-password" />
                  <button type="button" class="btn-outline-soft password-toggle" data-action="toggle-password" data-target="signin-password" aria-label="Toggle password">
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              </div>
              <div class="d-grid gap-2 mt-4">
                <button class="btn-gradient" type="submit">Sign in</button>
                <button class="btn-outline-soft" type="button" data-route="demo-login">Try demo account</button>
              </div>
              <p class="muted text-center mt-4 mb-0">
                Don't have an account? <a href="#/signup" data-route="signup"><strong>Create one</strong></a>.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  `;
}

function renderSignUp() {
  return `
    <div class="auth-shell fade-in">
      <div class="glass-card p-4">
        ${renderAuthBrandNav()}
        <div class="auth-grid">
          <section class="glass-card auth-story p-4">
            <div class="section-kicker">Onboarding</div>
            <h1 class="mt-3 mb-3">Create a trusted identity before you start swapping.</h1>
            <p class="muted">
              Build a profile, choose the work you offer, define what you need, and let the marketplace surface relevant exchange opportunities.
            </p>
            <div class="hero-image mt-4">
              <img src="${artwork.onboarding}" alt="Swapski onboarding illustration" />
            </div>
            <div class="hero-metrics mt-4">
              ${metricCard("300 credits", "Sign up bonus")}
              ${metricCard("Fast", "Guided setup flow")}
              ${metricCard("Smart", "Skill-based matches")}
            </div>
          </section>
          <section class="glass-card auth-card">
            <div class="eyebrow">Create your account</div>
            <h2 class="mt-3">Join Swapski</h2>
            <p class="muted">
              Choose your own name, get 300 bonus credits, and start exploring the marketplace right away.
            </p>
            <form id="signup-form" class="mt-4">
              <div class="mb-3">
                <label class="form-label" for="signup-name">Full name</label>
                <input class="form-control" id="signup-name" name="name" placeholder="e.g. Alex Johnson" required autocomplete="name" />
              </div>
              <div class="mb-3">
                <label class="form-label" for="signup-email">Email</label>
                <input class="form-control" id="signup-email" name="email" type="email" placeholder="you@example.com" required autocomplete="email" />
              </div>
              <div class="mb-3">
                <label class="form-label" for="signup-password">Password</label>
                <div class="input-group password-group">
                  <input class="form-control" id="signup-password" name="password" type="password" placeholder="Create a strong password" required autocomplete="new-password" />
                  <button type="button" class="btn-outline-soft password-toggle" data-action="toggle-password" data-target="signup-password" aria-label="Toggle password">
                    <i class="bi bi-eye"></i>
                  </button>
                </div>
              </div>
              <div class="d-grid gap-2 mt-4">
                <button class="btn-gradient" type="submit"><i class="bi bi-gift pe-1"></i> Create account & get 300 credits</button>
                <button class="btn-outline-soft" type="button" data-route="demo-login">Try demo first</button>
              </div>
              <p class="muted text-center mt-4 mb-0">
                Already have an account? <a href="#/signin" data-route="signin"><strong>Sign in</strong></a>.
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  `;
}

function renderDemoLogin() {
  return `
    <div class="auth-shell fade-in">
      <div class="glass-card p-4">
        ${renderAuthBrandNav()}
        <div class="auth-grid">
          <section class="glass-card auth-story p-4">
            <div class="section-kicker">Product Demo</div>
            <h1 class="mt-3 mb-3">Try Swapski in 10 seconds.</h1>
            <p class="muted">
              Skip registration and explore a fully-populated demo identity — matches, open swaps, wallet ledger, and messaging already live.
            </p>
            <div class="hero-image mt-4">
              <img src="${artwork.onboarding}" alt="Swapski onboarding illustration" />
            </div>
            <div class="hero-metrics mt-4">
              ${metricCard("Instant", "One-click access")}
              ${metricCard("Populated", "Pre-loaded matches")}
              ${metricCard("Private", "Local-only data")}
            </div>
          </section>
          <section class="glass-card auth-card">
            <div class="eyebrow">Demo credentials</div>
            <h2 class="mt-3">Try Swapski Demo</h2>
            <p class="muted">Explore the full experience instantly with a pre-configured demo account.</p>
            <div class="glass-card-soft mt-4">
              <div class="d-flex align-items-center justify-content-between mb-2">
                <span class="eyebrow">DEMO ACCOUNT</span>
                <span class="badge-soft"><i class="bi bi-shield-lock text-cyan"></i> Sample data only</span>
              </div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="fw-semibold" style="min-width:78px;">Email</span>
                <code class="demo-credential flex-grow-1">demo@swapski.com</code>
                <button class="btn-ghost" data-action="copy-text" data-text="demo@swapski.com" type="button"><i class="bi bi-clipboard"></i> Copy</button>
              </div>
              <div class="d-flex align-items-center gap-2">
                <span class="fw-semibold" style="min-width:78px;">Password</span>
                <code class="demo-credential flex-grow-1">Demo123!</code>
                <button class="btn-ghost" data-action="copy-text" data-text="Demo123!" type="button"><i class="bi bi-clipboard"></i> Copy</button>
              </div>
            </div>
            <div class="d-grid gap-2 mt-4">
              <button class="btn-gradient" data-action="launch-demo" type="button"><i class="bi bi-lightning-charge"></i> Continue with Demo Account</button>
              <button class="btn-outline-soft" data-route="signup" type="button"><i class="bi bi-person-plus"></i> Create Your Own Account</button>
              <button class="btn-ghost" data-route="landing" type="button"><i class="bi bi-arrow-left"></i> Back to Home</button>
            </div>
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
          <button class="btn-gradient" data-route="marketplace">Discover services</button>
        </div>
      </div>

      <div class="stats-grid">
        ${dashboardStat(`Available credits <span class="demo-badge ms-2" style="padding:1px 6px;font-size:0.55rem;">Demo</span>`, formatCredits(wallet.available), "bi-wallet2")}
        ${dashboardStat(`In escrow <span class="demo-badge ms-2" style="padding:1px 6px;font-size:0.55rem;">Demo</span>`, formatCredits(wallet.escrow), "bi-safe")}
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
          <div class="d-flex align-items-center gap-2 flex-wrap">
            <div class="eyebrow">Credit Summary</div>
            <span class="demo-badge"><i class="bi bi-lightning"></i> Demo Simulation</span>
          </div>
          <h3 class="mt-3">Balance & Escrow</h3>
          <p class="muted mb-3">Derived automatically from active requests. No real funds — all credits are simulated.</p>
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
  const wallet = getWalletMetrics(user.id);

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Profile</div>
          <h1 class="mt-3">Your public exchange profile.</h1>
          <p>Everything other members need to trust you: skills, reputation, service packaging, and delivery signals.</p>
        </div>
        <div class="inline-actions">
          <button class="btn-ghost" data-action="open-edit-profile">
            <i class="bi bi-pencil-square pe-1"></i> Edit profile
          </button>
          <button class="btn-gradient" data-action="open-create-service">Add service</button>
        </div>
      </div>
      <div class="profile-layout">
        <aside class="content-stack">
          <div class="profile-card profile-hero">
            <div class="profile-cover"></div>
            <div class="card-header-row">
              <div class="avatar-ring" style="background: linear-gradient(135deg, ${user.gradFrom || "#6366f1"}, ${user.gradTo || "#8b5cf6"});">
                ${user.profilePic
                  ? `<img src="${user.profilePic}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" />`
                  : user.avatar}
              </div>
              <div>
                <h3 class="mb-1">${user.name}</h3>
                <div class="profile-meta">${user.handle} • ${user.location}</div>
                <div class="muted small mt-1">${user.headline || ""}</div>
              </div>
            </div>
            <div class="chip-row">
              <span class="badge-soft">${user.trustScore} trust score</span>
              <span class="badge-soft">${user.rating ? user.rating.toFixed(1) + " rating" : "New member"}</span>
              <span class="badge-soft">${user.completedSwaps} swaps</span>
              <span class="badge-soft">${formatCredits(wallet.available)}</span>
            </div>
            <p class="muted">${user.bio}</p>
          </div>

          <div class="profile-card">
            <div class="eyebrow">Skills offered</div>
            <div class="skill-cloud mt-3">
              ${user.skillsOffered.length
                ? user.skillsOffered.map((skill) => `<span class="skill-chip active">${skill}</span>`).join("")
                : '<div class="muted">No skills listed yet. Edit your profile to add skills.</div>'}
            </div>
            <div class="eyebrow mt-4">Skills wanted</div>
            <div class="skill-cloud mt-3">
              ${user.skillsWanted.length
                ? user.skillsWanted.map((skill) => `<span class="skill-chip">${skill}</span>`).join("")
                : '<div class="muted">No wanted skills listed yet.</div>'}
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
              ${myServices.length
                ? myServices.map((service) => compactService(service, true)).join("")
                : '<div class="muted p-3">You haven\'t published any services yet. Click "Create service" to list your first skill offering.</div>'}
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
              ${reviews.length
                ? reviews.map((review) => renderReview(review)).join("")
                : '<div class="muted p-3">No reviews yet. Complete your first swap to unlock social proof on your profile.</div>'}
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
  const inProgress = requests.find((r) => r.status !== "completed" && r.status !== "requested");
  const demoPhase = inProgress ? calculateDemoProgress(inProgress) : null;

  return `
    <section class="content-stack fade-in task-page-shell">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Task management</div>
          <h1 class="mt-3">Your workboard</h1>
          <p>Keep every swap moving, from the first request to the final handoff.</p>
        </div>
        <div class="page-header-actions">
          <button class="btn-outline-soft" data-route="messages"><i class="bi bi-chat-left-text"></i> Messages</button>
          <button class="btn-gradient" data-route="marketplace"><i class="bi bi-plus-lg"></i> Find a service</button>
        </div>
      </div>
      ${requests.length ? `
        <div class="glass-card-soft task-progress-panel p-4 mb-4">
          <div class="card-header-row mb-3">
            <div>
              <div class="eyebrow">Current workflow</div>
              <h3 class="mt-3 mb-1">Your swap journey</h3>
            </div>
            <span class="demo-badge"><i class="bi bi-lightning"></i> Demo mode</span>
          </div>
          ${demoPhase && inProgress ? renderProgressGuide(demoPhase, inProgress.id) : `
            <div class="progress-ribbon">
              ${PROGRESS_PHASES.map((p) => `
                <div class="progress-pip" title="${p.label}">
                  <i class="bi ${p.icon}"></i>
                  <span>${p.label}</span>
                </div>
              `).join("")}
            </div>
            <p class="muted mt-3 mb-0 small">Accept a service to kick off the interactive flow above.</p>
          `}
        </div>
      ` : ""}
      <div class="task-toolbar">
        <div>
          <strong>All tasks</strong>
          <span class="muted">${requests.length} ${requests.length === 1 ? "task" : "tasks"}</span>
        </div>
        <div class="task-toolbar-controls">
          <label class="task-search" aria-label="Search tasks">
            <i class="bi bi-search"></i>
            <input type="search" placeholder="Search tasks or people" />
          </label>
          <button class="btn-outline-soft task-sort-button" type="button"><i class="bi bi-filter"></i> All status <i class="bi bi-chevron-down"></i></button>
        </div>
      </div>
      <div class="task-grid">
        ${columns
          .map((column) => {
            const columnRequests = requests.filter((request) => request.status === column.key);
            return `
              <section class="glass-card kanban-column">
                <div class="card-header-row">
                  <div class="kanban-heading"><span class="kanban-dot ${column.key}"></span><h3>${column.label}</h3></div>
                  <span class="column-count">${columnRequests.length}</span>
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

function discoverUserCard(user) {
  const me = getCurrentUser();
  const offered = (user.skillOffered || user.skillsOffered || []).slice(0, 3).map(skillChip).join("");
  const wanted = (user.skillWanted || user.skillsWanted || []).slice(0, 3).map((s) => badgeSoft("bi-suit-heart", s)).join("");
  const favorites = Array.isArray(state.favorites) ? state.favorites : [];
  const isSaved = favorites.some((f) => f.userId === me.id && f.targetId === user.id);
  const topService = state.services.find((s) => s.userId === user.id);
  const hasExistingChat = state.requests.some((r) =>
    (r.requesterId === me.id && r.providerId === user.id) ||
    (r.providerId === me.id && r.requesterId === user.id)
  );
  return `
    <article class="glass-card user-card fade-in">
      <div class="card-header-row">
        <div class="d-flex align-items-center gap-3">
          <div class="avatar avatar-lg" style="background: linear-gradient(135deg, ${user.gradFrom || "#6366f1"}, ${user.gradTo || "#8b5cf6"});">${getInitials(user.name)}</div>
          <div>
            <h3 class="h5 mb-0">${user.name}</h3>
            <div class="muted small">${user.headline || "Swapping skills to move projects forward"}</div>
            <div class="d-flex align-items-center gap-3 mt-1 small muted">
              <span><i class="bi bi-star-fill text-warning pe-1"></i>${(user.rating ?? 4.5).toFixed(1)}</span>
              <span><i class="bi bi-patch-check-fill text-cyan pe-1"></i>${user.completedSwaps || 0} swaps</span>
            </div>
          </div>
        </div>
        <button class="btn-ghost round-icon ${isSaved ? "saved" : ""}" data-action="${isSaved ? "unsave-user" : "save-user"}" data-target-id="${user.id}" title="${isSaved ? "Remove from Saved" : "Save to favorites"}" aria-label="${isSaved ? "Unsave user" : "Save user"}">
          <i class="bi bi-heart${isSaved ? "-fill text-cyan" : ""}"></i>
        </button>
      </div>
      ${offered ? `<div class="mt-4"><div class="eyebrow mb-2">Offering</div><div class="d-flex flex-wrap gap-2">${offered}</div></div>` : ""}
      ${wanted ? `<div class="mt-4"><div class="eyebrow mb-2">Looking for</div><div class="d-flex flex-wrap gap-2">${wanted}</div></div>` : ""}
      ${topService ? `
        <div class="glass-card-soft mt-4 p-4">
          <div class="eyebrow">Top service</div>
          <div class="h6 mt-2 mb-1">${topService.title}</div>
          <div class="muted small mb-3">${truncate(topService.description, 88)}</div>
          <div class="d-flex align-items-center justify-content-between">
            <div class="hero-metric"><strong>${formatCredits(topService.creditCost)}</strong><div class="muted x-small">Starting</div></div>
            <div class="muted small">${topService.deliveryTime || "Flexible"}</div>
          </div>
        </div>
      ` : ""}
      <div class="hero-actions mt-4 mb-0">
        <button class="btn-outline-soft" data-action="message-user" data-partner-id="${user.id}" title="${hasExistingChat ? `Open chat with ${user.name}` : "Accept a service offer first to start chatting"}" ${!hasExistingChat ? 'style="opacity:0.6;"' : ""}>
          <i class="bi bi-chat-dots pe-1"></i> Message ${!hasExistingChat ? '<span class="x-small">(needs swap)</span>' : ""}
        </button>
        ${topService ? `
          <button class="btn-gradient" data-action="accept-offer" data-service-id="${topService.id}" aria-label="Accept ${topService.title}">
            <i class="bi bi-check-circle pe-1"></i> Accept task
          </button>
        ` : `<button class="btn-gradient" data-route="marketplace"><i class="bi bi-hand-thumbs-up pe-1"></i> View services</button>`}
      </div>
    </article>
  `;
}

function renderDiscover() {
  const me = getCurrentUser();
  const others = state.users.filter((u) => u.id !== me.id);
  const myWants = new Set([...(me.skillWanted || me.skillsWanted || [])]);
  const activeCategory = state.ui.discoverCategory || "All";
  const categories = ["All", "Development", "Design", "Creative", "Research", "Strategy", "Marketing", "Tutoring"];
  const categorySkills = {
    Development: ["Frontend Dev", "Backend APIs", "No-Code", "Automation"],
    Design: ["UI Design", "Brand Identity"],
    Creative: ["Motion Design", "Video Editing", "Copywriting"],
    Research: ["Research"],
    Strategy: ["Product Strategy", "Pitch Decks"],
    Marketing: ["Growth Marketing", "SEO"],
    Tutoring: ["Tutoring"],
  };
  const allowedSkills = activeCategory === "All" ? null : new Set(categorySkills[activeCategory] || []);

  const matches = others
    .map((u) => {
      const userSkills = new Set([...(u.skillOffered || u.skillsOffered || [])]);
      const offerScore = [...userSkills].filter((s) => myWants.has(s)).length;
      const categoryMatch = allowedSkills === null || [...userSkills].some((s) => allowedSkills.has(s));
      return { user: u, offerScore, categoryMatch };
    })
    .filter((m) => m.categoryMatch)
    .sort((a, b) => b.offerScore - a.offerScore);

  const tabs = categories
    .map((c, idx) => {
      const iconClass = idx === 0 ? "grid-3x3-gap-fill" : idx === 1 ? "braces-asterisk" : idx === 2 ? "palette-fill" : idx === 3 ? "brush-fill" : idx === 4 ? "search" : idx === 5 ? "compass-fill" : idx === 6 ? "megaphone-fill" : "mortarboard-fill";
      const active = c === activeCategory ? "active" : "";
      return `<button class="category-tab ${active}" data-action="discover-filter" data-category="${c}"><i class="bi bi-${iconClass} me-2"></i>${c}</button>`;
    })
    .join("");

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Discover</div>
          <h1 class="mt-3">Find the right swap partner.</h1>
          <p>Browse verified talent offering the skills you want, sorted by best fit with your skill requests.</p>
        </div>
      </div>
      <div class="category-nav-bar mt-4 mb-2">
        ${tabs}
      </div>
      <div class="marketplace-grid mt-4">
        ${matches.map((m) => discoverUserCard(m.user)).join("")}
      </div>
      ${matches.length === 0 ? `
        <div class="empty-state mt-6">
          <i class="bi bi-people"></i>
          <h3>No matches in this category</h3>
          <p>Try switching to a different category or check back soon — more Swapski members are joining every week.</p>
        </div>
      ` : ""}
    </section>
  `;
}

function renderMatches() {
  const me = getCurrentUser();
  const myOffers = new Set([...(me.skillOffered || me.skillsOffered || [])]);
  const myWants = new Set([...(me.skillWanted || me.skillsWanted || [])]);
  const scored = state.users
    .filter((u) => u.id !== me.id)
    .map((u) => {
      const theyOfferIWant = [...(u.skillOffered || u.skillsOffered || [])].filter((s) => myWants.has(s));
      const iOfferTheyWant = [...(me.skillOffered || me.skillsOffered || [])].filter((s) => [...(u.skillWanted || u.skillsWanted || [])].includes(s));
      const union = new Set([...(u.skillOffered || u.skillsOffered || []), ...(me.skillOffered || me.skillsOffered || []), ...(u.skillWanted || u.skillsWanted || []), ...(me.skillWanted || me.skillsWanted || [])]).size || 1;
      const pct = Math.min(98, Math.round(((theyOfferIWant.length + iOfferTheyWant.length) * 100) / Math.max(1, Math.sqrt(union))));
      return { user: u, pct: Math.max(22, pct), theyOfferIWant, iOfferTheyWant };
    })
    .sort((a, b) => b.pct - a.pct);

  const favorites = Array.isArray(state.favorites) ? state.favorites : [];
  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Matches</div>
          <h1 class="mt-3">Reciprocal swap opportunities.</h1>
          <p>We surface members whose offered skills overlap with what you need AND your offered skills match their needs.</p>
        </div>
      </div>
      <div class="marketplace-grid mt-4">
        ${scored
          .map((m) => {
            const isSaved = favorites.some((f) => f.userId === me.id && f.targetId === m.user.id);
            const hasExistingChat = state.requests.some((r) =>
              (r.requesterId === me.id && r.providerId === m.user.id) ||
              (r.providerId === me.id && r.requesterId === m.user.id)
            );
            const topService = state.services.find((s) => s.userId === m.user.id);
            return `
            <article class="glass-card user-card fade-in">
              <div class="card-header-row align-items-start">
                <div class="d-flex align-items-start gap-3">
                  <div class="avatar avatar-lg" style="background: linear-gradient(135deg, ${m.user.gradFrom || "#6366f1"}, ${m.user.gradTo || "#8b5cf6"});">${getInitials(m.user.name)}</div>
                  <div>
                    <h3 class="h5 mb-0">${m.user.name}</h3>
                    <div class="muted small mb-2">${m.user.headline || "Swapping skills to move projects forward"}</div>
                    <div class="hero-metrics mt-2">
                      ${metricCard(`${m.pct}%`, "Match score")}
                      ${metricCard(`${m.user.completedSwaps || 0}`, "Past swaps")}
                      ${metricCard(`${(m.user.rating ?? 4.5).toFixed(1)}`, "Rating")}
                    </div>
                  </div>
                </div>
                <span class="badge badge-pill match-${m.pct >= 70 ? "high" : m.pct >= 50 ? "med" : "low"}"><i class="bi bi-lightning-charge-fill me-1"></i>${m.pct}%</span>
              </div>
              ${m.theyOfferIWant.length ? `<div class="mt-4"><div class="eyebrow mb-2">They have what you want</div><div class="d-flex flex-wrap gap-2">${m.theyOfferIWant.map(skillChip).join("")}</div></div>` : ""}
              ${m.iOfferTheyWant.length ? `<div class="mt-4"><div class="eyebrow mb-2">You could offer</div><div class="d-flex flex-wrap gap-2">${m.iOfferTheyWant.map((s) => badgeSoft("bi-hand-thumbs-up", s)).join("")}</div></div>` : ""}
              <div class="hero-actions mt-4 mb-0">
                <button class="btn-outline-soft round-icon ${isSaved ? "saved" : ""}" data-action="${isSaved ? "unsave-user" : "save-user"}" data-target-id="${m.user.id}" aria-label="Save"><i class="bi bi-heart${isSaved ? "-fill text-cyan" : ""}"></i></button>
                <button class="btn-outline-soft flex-grow-1" data-action="message-user" data-partner-id="${m.user.id}" title="${hasExistingChat ? `Open chat with ${m.user.name}` : "Accept a service offer first to start chatting"}" ${!hasExistingChat ? 'style="opacity:0.6;"' : ""}>
                  <i class="bi bi-chat-dots pe-1"></i> Message ${!hasExistingChat ? '<span class="x-small">(needs swap)</span>' : ""}
                </button>
                ${topService
                  ? `<button class="btn-gradient flex-grow-1" data-action="accept-offer" data-service-id="${topService.id}"><i class="bi bi-check-circle pe-1"></i> Accept offer</button>`
                  : `<button class="btn-gradient flex-grow-1" data-route="marketplace"><i class="bi bi-lightning-charge pe-1"></i> Find services</button>`}
              </div>
            </article>
          `;
          })
          .join("")}
      </div>
      ${scored.length === 0 ? `
        <div class="empty-state mt-6">
          <i class="bi bi-shuffle"></i>
          <h3>Build a fuller profile first</h3>
          <p>Add a few offered and wanted skills on your Profile, then come back — our match engine uses those to score reciprocal opportunities.</p>
        </div>
      ` : ""}
    </section>
  `;
}

function renderFavorites() {
  const me = getCurrentUser();
  const favs = Array.isArray(state.favorites) ? state.favorites : [];
  const savedIds = new Set(favs.filter((f) => f.userId === me.id).map((f) => f.targetId));
  const savedUsers = state.users.filter((u) => savedIds.has(u.id));
  const savedServiceIds = new Set(favs.filter((f) => f.userId === me.id && f.serviceId).map((f) => f.serviceId));
  const savedServices = state.services.filter((s) => savedServiceIds.has(s.id));

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Saved</div>
          <h1 class="mt-3">Your shortlist of swaps.</h1>
          <p>Keep track of collaborators and service packages for later — everything is saved locally between sessions.</p>
        </div>
      </div>
      <section class="mt-6">
        <div class="section-header mb-4">
          <h2>Saved people (${savedUsers.length})</h2>
          <button class="btn-outline-soft" data-route="marketplace">Browse more <i class="bi bi-arrow-right ms-2"></i></button>
        </div>
        ${savedUsers.length ? `
          <div class="marketplace-grid">
            ${savedUsers.map(discoverUserCard).join("")}
          </div>
        ` : `
          <div class="empty-state">
            <i class="bi bi-people-fill"></i>
            <h3>No saved profiles yet</h3>
            <p>Tap the heart icon on any Marketplace or service card to save a collaborator.</p>
            <div class="hero-actions justify-content-center mt-4 mb-0">
              <button class="btn-gradient" data-route="marketplace"><i class="bi bi-shop pe-1"></i> Open Marketplace</button>
            </div>
          </div>
        `}
      </section>
      <section class="mt-8">
        <div class="section-header mb-4">
          <h2>Saved services (${savedServices.length})</h2>
          <button class="btn-outline-soft" data-route="marketplace">Open marketplace <i class="bi bi-arrow-right ms-2"></i></button>
        </div>
        ${savedServices.length ? `
          <div class="marketplace-grid">
            ${savedServices.map(serviceCard).join("")}
          </div>
        ` : `
          <div class="empty-state">
            <i class="bi bi-bookmark-heart"></i>
            <h3>No saved services yet</h3>
            <p>Save any Marketplace service and it will appear here, ready to request when you have credits.</p>
            <div class="hero-actions justify-content-center mt-4 mb-0">
              <button class="btn-gradient" data-route="marketplace"><i class="bi bi-shop pe-1"></i> Browse Marketplace</button>
            </div>
          </div>
        `}
      </section>
    </section>
  `;
}

function renderNotifications() {
  const me = getCurrentUser();
  const notes = Array.isArray(state.notifications) ? state.notifications : [];
  const list = notes.filter((n) => n.userId === me.id).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unreadCount = list.filter((n) => !n.readAt).length;
  const items = list
    .map((n) => {
      const icon = n.type === "message" ? "bi-chat-dots-fill" : n.type === "swap" ? "bi-lightning-charge-fill" : n.type === "wallet" ? "bi-wallet2" : n.type === "review" ? "bi-star-fill" : "bi-bell-fill";
      return `
      <article class="activity-row ${!n.readAt ? "unread" : ""}">
        <div class="activity-icon"><i class="bi ${icon}"></i></div>
        <div class="activity-body">
          <div class="row g-0 align-items-start">
            <div class="col">
              <strong>${n.title}</strong>
              <div class="muted mt-1">${n.body}</div>
              <div class="x-small muted mt-2">${n.createdAt ? formatDateTime(n.createdAt) : ""}</div>
            </div>
            <div class="col-auto d-flex align-items-center gap-2">
              ${!n.readAt ? `<button class="btn-ghost round-icon" data-action="mark-notification-read" data-notification-id="${n.id}" title="Mark as read"><i class="bi bi-check2-all"></i></button>` : ""}
              ${n.route ? `<button class="btn-outline-soft" data-route="${n.route}">Open</button>` : ""}
            </div>
          </div>
        </div>
      </article>`;
    })
    .join("");

  return `
    <section class="content-stack fade-in">
      <div class="page-header">
        <div class="page-title">
          <div class="section-kicker">Notifications ${unreadCount ? `<span class="badge badge-pill badge-soft ms-2"><i class="bi bi-dot text-cyan me-1"></i>${unreadCount} unread</span>` : ""}</div>
          <h1 class="mt-3">Stay on top of your swaps.</h1>
          <p>Every important update — requests, messages, wallet movements, and reviews — lives here.</p>
        </div>
        <div class="hero-actions mt-0">
          ${unreadCount ? `<button class="btn-outline-soft" data-action="mark-all-notifications-read"><i class="bi bi-check2-all pe-1"></i> Mark all read</button>` : ""}
          <button class="btn-ghost round-icon" data-action="refresh" aria-label="Refresh notifications" title="Refresh"><i class="bi bi-arrow-clockwise"></i></button>
        </div>
      </div>
      <div class="glass-card mt-4 p-0 overflow-hidden">
        ${list.length ? items : `
          <div class="empty-state">
            <i class="bi bi-inbox"></i>
            <h3>Inbox is clear</h3>
            <p>Start browsing the Marketplace, send a request in Messages, or Launch the demo to begin populating updates here.</p>
            <div class="hero-actions justify-content-center mt-4 mb-0">
              <button class="btn-gradient" data-route="marketplace"><i class="bi bi-shop pe-1"></i> Find a swap</button>
            </div>
          </div>
        `}
      </div>
    </section>
  `;
}

function renderModal() {
  if (state.ui.showEditProfile) {
    const user = getCurrentUser();
    return `
      <div class="modal-overlay" data-action="close-edit-profile">
        <div class="glass-card modal-card" data-stop-propagation="true">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Edit profile</div>
              <h3 class="mt-3 mb-1">Update your exchange identity.</h3>
            </div>
            <button class="btn-outline-soft" data-action="close-edit-profile">Close</button>
          </div>
          <form id="edit-profile-form" class="mt-4">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="ep-name">Display name</label>
                <input class="form-control" id="ep-name" name="name" value="${user.name}" required />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="ep-location">Location</label>
                <input class="form-control" id="ep-location" name="location" value="${user.location}" />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="ep-timezone">Timezone</label>
                <input class="form-control" id="ep-timezone" name="timezone" value="${user.timezone}" />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="ep-headline">Headline</label>
                <input class="form-control" id="ep-headline" name="headline" value="${user.headline}" />
              </div>
              <div class="col-12">
                <label class="form-label" for="ep-bio">Bio</label>
                <textarea class="form-control" id="ep-bio" name="bio" rows="3">${user.bio}</textarea>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="ep-offered">Skills offered (comma separated)</label>
                <input class="form-control" id="ep-offered" name="skillsOffered" value="${(user.skillsOffered || []).join(', ')}" placeholder="UI Design, Brand Identity, Pitch Decks" />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="ep-wanted">Skills wanted (comma separated)</label>
                <input class="form-control" id="ep-wanted" name="skillsWanted" value="${(user.skillsWanted || []).join(', ')}" placeholder="Frontend Dev, Backend APIs" />
              </div>
              <div class="col-md-12">
                <label class="form-label" for="ep-pic">Profile picture URL (optional)</label>
                <input class="form-control" id="ep-pic" name="profilePic" value="${user.profilePic || ''}" placeholder="https://example.com/your-photo.jpg" />
                <div class="muted small mt-1 mt-2">Leave empty to use your initials.</div>
              </div>
              <div class="col-md-6">
                <label class="form-label" for="ep-gfrom">Avatar gradient start (from)</label>
                <input class="form-control" id="ep-gfrom" name="gradFrom" type="color" value="${user.gradFrom || '#6366f1'}" />
              </div>
              <div class="col-md-6">
                <label class="form-label" for="ep-gto">Avatar gradient end (to)</label>
                <input class="form-control" id="ep-gto" name="gradTo" type="color" value="${user.gradTo || '#8b5cf6'}" />
              </div>
            </div>
            <div class="hero-actions mt-4 mb-0">
              <button class="btn-gradient" type="submit"><i class="bi bi-check2 pe-1"></i> Save changes</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (state.ui.showSubmitDelivery && state.ui.submitDeliveryRequestId) {
    const request = state.requests.find((r) => r.id === state.ui.submitDeliveryRequestId);
    const service = request ? state.services.find((s) => s.id === request.serviceId) : null;
    if (!request) return "";
    return `
      <div class="modal-overlay" data-action="close-submit-delivery">
        <div class="glass-card modal-card" data-stop-propagation="true">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Submit delivery</div>
              <h3 class="mt-3 mb-1">${service?.title || "Task delivery"}</h3>
            </div>
            <button class="btn-outline-soft" data-action="close-submit-delivery">Close</button>
          </div>
          <p class="muted mt-3">Share a link to your finished work and attach any files. The requester will be notified and can either approve or request changes.</p>
          <form id="submit-delivery-form" class="mt-4">
            <input type="hidden" name="requestId" value="${request.id}" />
            <div class="mb-3">
              <label class="form-label" for="sd-link">Link to finished work</label>
              <input class="form-control" id="sd-link" name="deliveryLink" type="url" placeholder="https://figma.com/file/... or https://github.com/..." />
              <div class="muted small mt-1 mt-2">Figma, Notion, Google Drive, GitHub, or any shareable URL.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="sd-file">Attach a file (optional)</label>
              <input class="form-control" id="sd-file" name="attachment" type="file" />
              <div class="muted small mt-1 mt-2">Maximum ~5 MB — stores only metadata (file name, size, type) locally.</div>
            </div>
            <div class="mb-3">
              <label class="form-label" for="sd-note">Delivery note</label>
              <textarea class="form-control" id="sd-note" name="deliveryNote" rows="3" placeholder="Summarize what you delivered, decisions made, and any notes for the requester."></textarea>
            </div>
            <div class="hero-actions mt-4 mb-0">
              <button class="btn-gradient" type="submit">
                <i class="bi bi-send pe-1"></i> Submit for review
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  if (state.ui.showTaskCompleted && state.ui.completedRequestId) {
    const request = state.requests.find((r) => r.id === state.ui.completedRequestId);
    if (request) {
      const service = state.services.find((s) => s.id === request.serviceId);
      const partner = request.providerId === state.session.currentUserId
        ? getUser(request.requesterId)
        : getUser(request.providerId);
      const myWallet = getWalletMetrics(state.session.currentUserId);
      const myReviews = state.reviews.filter((r) => r.subjectId === state.session.currentUserId);
      const review = state.reviews.find(
        (r) => r.requestId === request.id && r.authorId !== state.session.currentUserId
      );
      return `
        <div class="modal-overlay" data-action="close-task-completed">
          <div class="glass-card modal-card large" data-stop-propagation="true">
            <div class="text-center mb-4">
              <div class="celebration-glow" aria-hidden="true"></div>
              <div class="icon-bubble celebration-icon mx-auto mb-3" style="background: linear-gradient(135deg, #37e28c, #22c55e);">
                <i class="bi bi-trophy-fill text-white" style="font-size: 28px;"></i>
              </div>
              <div class="eyebrow text-gradient fw-semibold">Swap complete</div>
              <h2 class="mt-3">Nice work — credits released!</h2>
              <p class="muted mt-2 mb-0">${service?.title || "Task completed"} · finished with ${partner?.name || "the partner"}</p>
            </div>
            <div class="glass-card-soft p-4 my-4">
              <div class="row g-4 text-center">
                <div class="col-md-4">
                  <div class="kpi-label muted">Credits earned</div>
                  <div class="kpi-value text-gradient mt-2">${formatCredits(request.creditAmount)}</div>
                  <div class="badge-soft mt-2">Demo Simulation · No Real Funds</div>
                </div>
                <div class="col-md-4">
                  <div class="kpi-label muted">Available balance</div>
                  <div class="kpi-value mt-2">${formatCredits(myWallet.available)}</div>
                  <div class="badge-soft mt-2">Ledger derived</div>
                </div>
                <div class="col-md-4">
                  <div class="kpi-label muted">Your review</div>
                  <div class="kpi-value mt-2 d-flex justify-content-center align-items-center gap-1">
                    ${review ? Array(5).fill(0).map((_, i) => `<i class="bi bi-star-fill ${i < (review.score || 0) ? "text-warning" : ""}"></i>`).join("") : "—"}
                  </div>
                  <div class="badge-soft mt-2">${myReviews.length} lifetime review${myReviews.length === 1 ? "" : "s"}</div>
                </div>
              </div>
            </div>
            ${review ? `
              <div class="glass-card-soft p-4 mb-4">
                <div class="d-flex gap-3 align-items-start">
                  <div class="avatar-ring" style="width:48px; height:48px; font-size: 14px;">${getInitials(partner?.name || "?")}</div>
                  <div class="flex-grow-1">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <strong>${partner?.name || "Partner"}</strong>
                      <span class="d-inline-flex gap-1">${Array(5).fill(0).map((_, i) => `<i class="bi bi-star-fill ${i < (review.score || 0) ? "text-warning" : "text-muted"}" style="font-size:12px;"></i>`).join("")}</span>
                    </div>
                    <p class="muted mb-0">"${review.review}"</p>
                  </div>
                </div>
              </div>
            ` : ""}
            <form id="post-completion-review-form" class="mb-4">
              <input type="hidden" name="requestId" value="${request.id}" />
              <div class="eyebrow">Leave your review</div>
              <h4 class="mt-3 mb-3">How was the swap with ${partner?.name || "your partner"}?</h4>
              <div class="mb-3">
                <div class="rating-input mb-2">
                  ${[5,4,3,2,1].map((n) => `<label class="rating-star" data-action="rate-star" data-request-id="${request.id}" data-score="${n}"><input type="radio" name="rating" value="${n}" class="d-none" /><i class="bi bi-star"></i></label>`).join("")}
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Short review (optional)</label>
                <textarea class="form-control" name="reviewText" rows="3" placeholder="A few words about communication, scope, and deliverables..."></textarea>
              </div>
            </form>
            <div class="hero-actions justify-content-end mb-0">
              <button class="btn-outline-soft" data-action="close-task-completed">Close</button>
              <button class="btn-gradient" data-action="finish-and-profile">Go to my profile</button>
            </div>
          </div>
        </div>
      `;
    }
  }

  if (state.ui.showWorkspace && state.ui.workspaceRequestId) {
    const request = state.requests.find((r) => r.id === state.ui.workspaceRequestId);
    if (!request) return "";
    const service = state.services.find((s) => s.id === request.serviceId);
    const me = getCurrentUser();
    const isProvider = request.providerId === me.id;
    const requester = getUser(request.requesterId);
    const provider = getUser(request.providerId);
    const partner = isProvider ? requester : provider;
    const brief = generateTaskBrief(service || { category: "Design", title: "Project" }, request.requesterId, (provider?.name) || "You");
    const deliveries = Array.isArray(request.deliveries) ? request.deliveries : [];
    const references = deliveries.filter((d) => d.isReference);
    const userDeliveries = deliveries.filter((d) => !d.isReference);
    const walletOfUser = isProvider ? getWalletMetrics(request.providerId) : getWalletMetrics(request.requesterId);
    const escrowEntry = state.ledger.find((l) => l.requestId === request.id && l.type === "lock");
    const releaseEntry = state.ledger.find((l) => l.requestId === request.id && l.type === "release");
    const earnEntry = state.ledger.find((l) => l.requestId === request.id && l.type === "earn");
    const ledgerLines = state.ledger.filter((l) => l.requestId === request.id);
    const defaultChecklist = [
      { id: "chk_scope", label: "Reviewed scope + success goals", checked: (request.checklist?.chk_scope ?? false) },
      { id: "chk_refs", label: "Downloaded all reference files / links", checked: (request.checklist?.chk_refs ?? false) },
      { id: "chk_draft", label: "Uploaded first draft / WIP", checked: (request.checklist?.chk_draft ?? (deliveries.filter((d) => !d.isReference).length >= 1)) },
      { id: "chk_polish", label: "Final polish & copy edit pass", checked: (request.checklist?.chk_polish ?? false) },
      { id: "chk_submit", label: "Delivery link + file + note attached", checked: (request.checklist?.chk_submit ?? (userDeliveries.length && userDeliveries.some((d) => d.link || d.fileName))) },
    ];
    const aiChat = state.ui.aiAssistantChat?.[request.id] || [];
    const progress = calculateDemoProgress(request);
    const tab = state.ui.workspaceTab || "overview";
    const tabs = [
      { id: "overview", label: "Overview", icon: "bi-kanban" },
      { id: "ai", label: "AI Assistant", icon: "bi-lightbulb" },
      { id: "chat", label: "Chat", icon: "bi-chat-dots" },
      { id: "deliverables", label: "Deliverables", icon: "bi-folder2-open" },
      { id: "activity", label: "Activity", icon: "bi-clock-history" },
      { id: "escrow", label: "Escrow", icon: "bi-shield-lock" },
    ];
    return `
      <div class="modal-overlay workspace-overlay" data-action="close-workspace">
        <div class="glass-card modal-card workspace-card" data-stop-propagation="true">
          <div class="workspace-header card-header-row">
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <span class="status-chip ${request.status}">${prettyStatus(request.status)}</span>
                <span class="badge-soft">
                  <i class="bi bi-lightning-charge"></i> ${formatCredits(request.creditAmount)}
                </span>
                <span class="badge-soft">
                  <i class="bi bi-shield-check"></i> Demo Simulation
                </span>
              </div>
              <h2 class="mt-3 mb-1">${service?.title || "Project workspace"}</h2>
              <div class="muted">${isProvider ? `You are the Provider · collaborating with ${requester?.name || "Requester"}` : `You are the Requester · ${provider?.name || "Provider"} is doing the work`}</div>
            </div>
            <div class="d-flex gap-2 align-items-center">
              <button class="btn-outline-soft" data-action="minimize-workspace">Open in Tasks</button>
              <button class="btn-outline-soft" data-action="close-workspace">Close</button>
            </div>
          </div>
          <div class="demo-progress-guide mb-3">
            ${renderProgressGuide(progress, request.id)}
          </div>
          <div class="workspace-tabs mb-3">
            ${tabs.map((t) => `
              <button class="workspace-tab ${tab === t.id ? "active" : ""}" data-action="switch-workspace-tab" data-tab="${t.id}" data-request-id="${request.id}">
                <i class="bi ${t.icon} me-1"></i>${t.label}
              </button>
            `).join("")}
          </div>
          <div class="workspace-body">
            ${tab === "overview" ? renderWorkspaceOverview({ request, service, isProvider, partner, requester, provider, references, userDeliveries, brief, checklist: defaultChecklist }) : ""}
            ${tab === "ai" ? renderWorkspaceAI({ request, service, brief, aiChat, isProvider, checklist: defaultChecklist }) : ""}
            ${tab === "chat" ? renderWorkspaceChat({ request, service, partner, isProvider }) : ""}
            ${tab === "deliverables" ? renderWorkspaceDeliverables({ request, service, isProvider, references, userDeliveries, checklist: defaultChecklist }) : ""}
            ${tab === "activity" ? renderWorkspaceActivity({ request, ledgerLines, isProvider, partner }) : ""}
            ${tab === "escrow" ? renderWorkspaceEscrow({ request, service, isProvider, walletOfUser, escrowEntry, releaseEntry, earnEntry, ledgerLines }) : ""}
          </div>
        </div>
      </div>
    `;
  }

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
  if (!event || !event.target) return;
  const inStopProp = !!event.target.closest("[data-stop-propagation='true']");
  const formEl = event.target.closest("form");
  const stopContainer = event.target.closest("[data-stop-propagation='true']");
  const target = event.target.closest("[data-action], [data-route]");
  if (inStopProp) {
    event.stopPropagation();
    if (!target || !stopContainer.contains(target)) return;
  }
  if (!target) return;

  triggerRipple(target);

  if (target.dataset.route) {
    navigate(target.dataset.route);
    return;
  }

  const action = target.dataset.action;

  if (action === "toggle-theme") {
    const next = state.preferences.theme === "light" ? "dark" : "light";
    applyTheme(next, true);
    setState((draft) => {
      draft.preferences.theme = next;
    }, { silent: true });
    showToast(`${next === "light" ? "☀️ Light" : "🌙 Dark"} mode`, `Theme switched to ${next} mode.`, "success");
    return;
  }

  if (action === "toggle-password") {
    const inputId = target.dataset.target;
    if (!inputId) return;
    const input = document.getElementById(inputId);
    if (!input) return;
    const isText = input.type === "text";
    input.type = isText ? "password" : "text";
    const icon = target.querySelector("i");
    if (icon) icon.className = isText ? "bi bi-eye" : "bi bi-eye-slash";
    return;
  }

  if (action === "copy-text") {
    const text = target.dataset.text || "";
    try {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand("copy"); } catch {}
        ta.remove();
      }
      showToast("Copied", `"${text}" copied to clipboard.`, "success");
    } catch {
      showToast("Copy failed", "Select the text and copy manually.", "error");
    }
    return;
  }

  if (action === "launch-demo") {
    const demoUser = state.users.find((u) => u.id === "user_1");
    if (demoUser) {
      setState((draft) => {
        draft.session.currentUserId = demoUser.id;
        draft.session.isAuthenticated = true;
        draft.session.onboardingComplete = true;
        draft.session.isDemo = true;
        draft.ui.route = "dashboard";
        draft.ui.demoTourStep = 1;
        draft.ui.demoTourDismissed = false;
      }, { silent: true });
      navigate("dashboard");
      showToast("Demo launched", `Signed in as ${demoUser.name}. The 5-step walkthrough has started.`, "success");
      startDemoTour();
    } else {
      quickSignIn();
    }
    return;
  }

  if (action === "demo-tour-next") {
    const totalSteps = 5;
    setState((draft) => {
      draft.ui.demoTourStep = Math.min(totalSteps + 1, (draft.ui.demoTourStep || 0) + 1);
      if (draft.ui.demoTourStep > totalSteps) draft.ui.demoTourDismissed = true;
    });
    if (state.ui.demoTourStep === 2) navigate("marketplace");
    if (state.ui.demoTourStep === 3) navigate("tasks");
    if (state.ui.demoTourStep === 4) navigate("messages");
    if (state.ui.demoTourStep === 5) navigate("profile");
    return;
  }

  if (action === "demo-tour-dismiss") {
    setState((draft) => {
      draft.ui.demoTourDismissed = true;
      draft.ui.demoTourStep = 0;
    });
    return;
  }

  if (action === "save-user") {
    const targetId = target.dataset.targetId;
    if (!targetId) return;
    const me = getCurrentUser();
    if (!state.favorites.some((f) => f.userId === me.id && f.targetId === targetId)) {
      setState((draft) => {
        draft.favorites.push({ id: `fav-${Date.now()}-${Math.floor(Math.random() * 9999)}`, userId: me.id, targetId, savedAt: new Date().toISOString() });
      });
      showToast("Saved", "Added to Saved list.", "success");
    }
    return;
  }

  if (action === "unsave-user") {
    const targetId = target.dataset.targetId;
    if (!targetId) return;
    const me = getCurrentUser();
    setState((draft) => {
      draft.favorites = draft.favorites.filter((f) => !(f.userId === me.id && f.targetId === targetId && !f.serviceId));
    });
    showToast("Removed", "Profile removed from Saved.", "success");
    return;
  }

  if (action === "open-service-modal") {
    const serviceId = target.dataset.serviceId;
    if (!serviceId) return;
    setState((draft) => {
      draft.ui.requestServiceId = serviceId;
      draft.ui.requestMessage = "";
    });
    return;
  }

  if (action === "discover-filter") {
    setState((draft) => {
      draft.ui.discoverCategory = target.dataset.category || "All";
    });
    return;
  }

  if (action === "mark-notification-read") {
    const id = target.dataset.notificationId;
    if (!id) return;
    setState((draft) => {
      const note = draft.notifications.find((n) => n.id === id);
      if (note) note.readAt = new Date().toISOString();
    });
    return;
  }

  if (action === "mark-all-notifications-read") {
    const me = getCurrentUser();
    const now = new Date().toISOString();
    setState((draft) => {
      draft.notifications.forEach((n) => { if (n.userId === me.id && !n.readAt) n.readAt = now; });
    });
    showToast("All caught up", "Notifications marked as read.", "success");
    return;
  }

  if (action === "refresh") {
    renderApp();
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
      draft.ui.showSubmitDelivery = false;
      draft.ui.submitDeliveryRequestId = null;
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
    return;
  }

  if (action === "save-service") {
    const serviceId = target.dataset.serviceId;
    if (!serviceId) return;
    const me = getCurrentUser();
    if (!state.favorites.some((f) => f.userId === me.id && f.serviceId === serviceId)) {
      setState((draft) => {
        draft.favorites.push({ id: `fav-${Date.now()}-${Math.floor(Math.random() * 9999)}`, userId: me.id, serviceId, savedAt: new Date().toISOString() });
      });
      showToast("Saved", "Service added to Saved list.", "success");
    }
    return;
  }

  if (action === "unsave-service") {
    const serviceId = target.dataset.serviceId;
    if (!serviceId) return;
    const me = getCurrentUser();
    setState((draft) => {
      draft.favorites = draft.favorites.filter((f) => !(f.userId === me.id && f.serviceId === serviceId));
    });
    showToast("Removed", "Service removed from Saved.", "success");
    return;
  }

  if (action === "accept-offer") {
    const serviceId = target.dataset.serviceId;
    if (!serviceId) return;
    const service = state.services.find((s) => s.id === serviceId);
    if (!service) return;
    const currentUser = getCurrentUser();
    if (service.userId === currentUser.id) {
      showToast("Your service", "This is your own service listing.", "warning");
      return;
    }
    const poster = getUser(service.userId);
    const posterWallet = getWalletMetrics(service.userId);
    if (posterWallet.available < service.creditCost) {
      showToast("Poster has insufficient credits", `${poster?.name || "The poster"} needs ${formatCredits(service.creditCost - posterWallet.available)} more in escrow.`, "error");
      return;
    }
    const requestId = makeId("req");
    setState((draft) => {
      draft.requests.unshift({
        id: requestId,
        serviceId: service.id,
        requesterId: service.userId,
        providerId: currentUser.id,
        status: "accepted",
        creditAmount: service.creditCost,
        createdAt: new Date().toISOString(),
        dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString(),
        summary: `${currentUser.name} accepted your "${service.title}" listing. Please share task details in the chat so they can begin work.`,
      });
      draft.ledger.unshift({
        id: makeId("led"),
        userId: service.userId,
        requestId,
        type: "lock",
        direction: "hold",
        amount: service.creditCost,
        status: "pending",
        createdAt: new Date().toISOString(),
        description: `Credits locked in escrow for "${service.title}" — provider ${currentUser.name} picked up this task`,
      });
      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: "system",
        body: `Task accepted by ${currentUser.name}. ${formatCredits(service.creditCost)} locked from ${poster?.name || "poster"}'s balance into escrow. ${poster?.name || "Poster"} — please share task details below.`,
        createdAt: new Date().toISOString(),
      });
      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: currentUser.id,
        body: `Hi! I've accepted your "${service.title}" offer and I'm ready to help. Please share the project brief, deliverables, and any reference materials so I can get started.`,
        createdAt: new Date().toISOString(),
      });
      draft.ui.activeInboxRequestId = requestId;
      draft.ui.route = "tasks";
      draft.notifications.unshift({
        id: makeId("note"),
        userId: currentUser.id,
        title: "Offer accepted",
        body: `Waiting for ${poster?.name || "the poster"} to share task details for "${service.title}".`,
        type: "swap",
        createdAt: new Date().toISOString(),
        readAt: null,
        route: "tasks",
        routeId: null,
      });
      draft.notifications.unshift({
        id: makeId("note"),
        userId: service.userId,
        title: "Provider picked up your task",
        body: `${currentUser.name} accepted "${service.title}". Share task details and deliverable requirements in the chat to begin.`,
        type: "swap",
        createdAt: new Date().toISOString(),
        readAt: null,
        route: "tasks",
        routeId: null,
      });
    }, { silent: true });
    setState((draft) => {
      draft.ui.workspaceRequestId = requestId;
      draft.ui.workspaceTab = "overview";
      draft.ui.showWorkspace = true;
      draft.ui.route = "tasks";
    });
    showToast("Offer accepted", "Project workspace is now open — review the AI brief, checklist, and start work.", "success");
    scheduleAIRequesterBrief(requestId);
    return;
  }

  if (action === "book-service") {
    const serviceId = target.dataset.serviceId;
    if (!serviceId) return;
    const service = state.services.find((s) => s.id === serviceId);
    if (!service) return;
    const currentUser = getCurrentUser();
    if (service.userId === currentUser.id) {
      showToast("Your service", "You can't book your own service listing.", "warning");
      return;
    }
    const myWallet = getWalletMetrics(currentUser.id);
    if (myWallet.available < service.creditCost) {
      showToast("Insufficient credits", `You need ${formatCredits(service.creditCost - myWallet.available)} more to book this service.`, "error");
      return;
    }
    const provider = getUser(service.userId);
    const requestId = makeId("req");
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
        summary: `You booked "${service.title}" from ${provider?.name || "the provider"}. Credits are locked and waiting for their confirmation.`,
      });
      draft.ledger.unshift({
        id: makeId("led"),
        userId: currentUser.id,
        requestId,
        type: "lock",
        direction: "hold",
        amount: service.creditCost,
        status: "pending",
        createdAt: new Date().toISOString(),
        description: `Credits locked in escrow for "${service.title}" — awaiting provider ${provider?.name || "acceptance"}`,
      });
      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: "system",
        body: `Request created. ${formatCredits(service.creditCost)} locked from your balance into escrow. Waiting for ${provider?.name || "the provider"} to accept this booking.`,
        createdAt: new Date().toISOString(),
      });
      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: currentUser.id,
        body: `Hi ${provider?.name?.split(" ")[0] || "there"}! I just booked your "${service.title}" service. I'm looking forward to a great collaboration — let me know what details you need from my side to get started!`,
        createdAt: new Date().toISOString(),
      });
      draft.ui.activeInboxRequestId = requestId;
      draft.ui.workspaceRequestId = requestId;
      draft.ui.workspaceTab = "overview";
      draft.ui.showWorkspace = true;
      draft.ui.route = "tasks";
      draft.notifications.unshift({
        id: makeId("note"),
        userId: currentUser.id,
        title: "Service booked",
        body: `${formatCredits(service.creditCost)} locked. Waiting for ${provider?.name || "the provider"} to confirm "${service.title}".`,
        type: "swap",
        createdAt: new Date().toISOString(),
        readAt: null,
        route: "tasks",
      });
      draft.notifications.unshift({
        id: makeId("note"),
        userId: service.userId,
        title: "New booking request",
        body: `${currentUser.name} booked your "${service.title}" service. Credits are already locked in escrow.`,
        type: "swap",
        createdAt: new Date().toISOString(),
        readAt: null,
        route: "tasks",
      });
    }, { silent: true });
    setState((draft) => {
      draft.ui.workspaceRequestId = requestId;
      draft.ui.workspaceTab = "overview";
      draft.ui.showWorkspace = true;
    });
    showToast("Service booked", `${formatCredits(service.creditCost)} locked in escrow. ${provider?.name || "The provider"} will confirm shortly.`, "success");
    if (isAIUser(service.userId)) {
      scheduleAIProviderWorkflow(requestId);
    }
    return;
  }

  if (action === "open-edit-profile") {
    setState((draft) => {
      draft.ui.showEditProfile = true;
    });
    return;
  }

  if (action === "close-edit-profile") {
    setState((draft) => {
      draft.ui.showEditProfile = false;
    });
    return;
  }

  if (action === "open-submit-delivery") {
    const requestId = target.dataset.requestId;
    if (!requestId) return;
    setState((draft) => {
      draft.ui.showSubmitDelivery = true;
      draft.ui.submitDeliveryRequestId = requestId;
    });
    return;
  }

  if (action === "close-submit-delivery") {
    setState((draft) => {
      draft.ui.showSubmitDelivery = false;
      draft.ui.submitDeliveryRequestId = null;
    });
    return;
  }

  if (action === "message-user") {
    const partnerId = target.dataset.partnerId;
    if (!partnerId) return;
    const me = getCurrentUser();
    const existing = state.requests.find((r) =>
      (r.requesterId === me.id && r.providerId === partnerId) ||
      (r.providerId === me.id && r.requesterId === partnerId)
    );
    if (existing) {
      setState((draft) => {
        draft.ui.activeInboxRequestId = existing.id;
        draft.ui.route = "messages";
        draft.ui.workspaceRequestId = existing.id;
        draft.ui.workspaceTab = "chat";
        draft.ui.showWorkspace = true;
      }, { silent: true });
      navigate("messages");
    } else {
      showToast("Start a swap first", "You can only message users after accepting their service offer or creating a request.", "warning");
    }
    return;
  }

  if (action === "open-workspace") {
    const requestId = target.dataset.requestId;
    if (!requestId) return;
    const tab = target.dataset.tab || "overview";
    setState((draft) => {
      draft.ui.workspaceRequestId = requestId;
      draft.ui.workspaceTab = tab;
      draft.ui.showWorkspace = true;
    });
    return;
  }

  if (action === "close-workspace") {
    setState((draft) => {
      draft.ui.showWorkspace = false;
      draft.ui.workspaceRequestId = null;
    });
    return;
  }

  if (action === "minimize-workspace") {
    const reqId = state.ui.workspaceRequestId;
    setState((draft) => {
      draft.ui.showWorkspace = false;
      draft.ui.route = "tasks";
    }, { silent: true });
    navigate("tasks");
    return;
  }

  if (action === "switch-workspace-tab") {
    const tab = target.dataset.tab;
    const requestId = target.dataset.requestId || state.ui.workspaceRequestId;
    if (!tab) return;
    setState((draft) => {
      draft.ui.workspaceTab = tab;
      if (requestId) draft.ui.workspaceRequestId = requestId;
      draft.ui.showWorkspace = true;
    });
    return;
  }

  if (action === "toggle-checklist") {
    const checkId = target.dataset.checkId;
    const requestId = target.dataset.requestId;
    if (!checkId || !requestId) return;
    setState((draft) => {
      const req = draft.requests.find((r) => r.id === requestId);
      if (!req) return;
      if (!req.checklist) req.checklist = {};
      req.checklist[checkId] = !!!req.checklist[checkId];
    });
    return;
  }

  if (action === "ai-suggest") {
    const requestId = target.dataset.requestId;
    const question = target.dataset.question;
    if (!requestId || !question) return;
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return;
    const service = state.services.find((s) => s.id === req.serviceId);
    const brief = generateTaskBrief(service || { category: "Design" }, req.requesterId, getUser(req.providerId)?.name || "You");
    const answer = aiAnswer(question, { request: req, service, brief });
    setState((draft) => {
      if (!draft.ui.aiAssistantChat) draft.ui.aiAssistantChat = {};
      if (!draft.ui.aiAssistantChat[requestId]) draft.ui.aiAssistantChat[requestId] = [];
      draft.ui.aiAssistantChat[requestId].push({ role: "user", body: question });
      draft.ui.aiAssistantChat[requestId].push({ role: "ai", body: answer });
      draft.ui.workspaceTab = "ai";
      draft.ui.showWorkspace = true;
      draft.ui.workspaceRequestId = requestId;
    });
    return;
  }

  if (action === "jump-phase") {
    const phase = target.dataset.phase;
    const requestId = target.dataset.requestId;
    const phaseMap = {
      discover: "overview",
      accept: "overview",
      brief: "ai",
      chat: "chat",
      work: "deliverables",
      submit: "deliverables",
      review: "activity",
      release: "escrow",
      earn: "escrow",
      review_given: "activity",
      done: "activity",
    };
    if (!phaseMap[phase] || !requestId) return;
    setState((draft) => {
      draft.ui.workspaceTab = phaseMap[phase];
      draft.ui.workspaceRequestId = requestId;
      draft.ui.showWorkspace = true;
    });
    return;
  }

  if (action === "workspace-submit-task") {
    const requestId = target.dataset.requestId;
    if (!requestId) return;
    // #region debug-point C:submit-task-entry
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "C", location: "app.js:handleClick:workspace-submit-task:entry", msg: "[DEBUG] workspace-submit-task fired", data: { requestId, currentUserId: getCurrentUser()?.id, ts: Date.now() }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return;
    const service = state.services.find((s) => s.id === req.serviceId);
    const me = getCurrentUser();
    const isProvider = req.providerId === me.id;
    const deliveryForm = document.getElementById("workspace-delivery-form");
    if (deliveryForm) {
      const formData = new FormData(deliveryForm);
      const pendingLink = String(formData.get("deliveryLink") || "").trim();
      const pendingNote = String(formData.get("deliveryNote") || "").trim();
      const pendingFile = formData.get("attachment");
      if (pendingLink || pendingNote || (pendingFile && pendingFile.name)) {
        const pendingDelivery = {
          id: makeId("dlv"),
          requestId,
          by: me.id,
          at: new Date().toISOString(),
          link: pendingLink || null,
          note: pendingNote || null,
          fileName: pendingFile?.name || null,
          fileSize: pendingFile?.size || null,
          fileType: pendingFile?.type || null,
        };
        if (!Array.isArray(req.deliveries)) req.deliveries = [];
        req.deliveries.push(pendingDelivery);
        if (!req.checklist) req.checklist = {};
        req.checklist.chk_scope = true;
        req.checklist.chk_refs = true;
        req.checklist.chk_draft = true;
        req.checklist.chk_submit = true;
        persist();
        deliveryForm.reset();
      }
    }
    const deliveries = Array.isArray(req.deliveries) ? req.deliveries : [];
    const userDeliveries = deliveries.filter((d) => !d.isReference);
    const hasDelivery = userDeliveries.some((d) => d.link || d.fileName);

    if (hasDelivery) {
      if (!req.checklist) req.checklist = {};
      req.checklist.chk_scope = true;
      req.checklist.chk_refs = true;
      req.checklist.chk_draft = true;
      req.checklist.chk_submit = true;
      persist();
    }

    const checklistKeys = ["chk_scope", "chk_refs", "chk_draft", "chk_polish", "chk_submit"];
    const checklistDone = checklistKeys.filter((k) => req.checklist && req.checklist[k]).length;
    const problems = [];
    // #region debug-point C:submit-check-state
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "C", location: "app.js:handleClick:workspace-submit-task:precheck", msg: "[DEBUG] precheck state", data: { requestId, isProvider, checklistDone, hasDelivery, deliveriesCount: userDeliveries.length, deliveries: userDeliveries.map(d => ({ id: d.id, link: !!d.link, fileName: d.fileName, note: (d.note || "").length })), requestStatus: req.status }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    if (!isProvider) problems.push("Only the provider submits for review. As the requester, approve or request changes on this tab.");
    if (!hasDelivery) problems.push("No deliverables found — add a link or attach a file first.");
    if (checklistDone < 3) problems.push(`Only ${checklistDone}/5 checklist items complete. Finish at least 3 before submitting.`);
    if (problems.length) {
      // #region debug-point C:submit-fail
      fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "C", location: "app.js:handleClick:workspace-submit-task:fail", msg: "[DEBUG] AI pre-check FAILED", data: { requestId, problems }, ts: Date.now() }) }).catch(() => {});
      // #endregion
      showToast("AI pre-check failed", problems.join(" "), "error");
      return;
    }
    // #region debug-point C:submit-pass
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "C", location: "app.js:handleClick:workspace-submit-task:pass", msg: "[DEBUG] AI pre-check PASSED → status=review + scheduleAIReview", data: { requestId, checklistDone, hasDelivery, delayMs: 3500 }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    showToast("AI pre-check passed", "Moving to review — the requester (or demo AI) will verify and release credits.", "success");
    updateRequestStatus(requestId, "review");
    scheduleAIReview(requestId, 3500);
    return;
  }

  if (action === "close-task-completed") {
    setState((draft) => {
      draft.ui.showTaskCompleted = false;
      draft.ui.completedRequestId = null;
    });
    return;
  }

  if (action === "finish-and-profile") {
    setState((draft) => {
      draft.ui.showTaskCompleted = false;
      draft.ui.completedRequestId = null;
      draft.ui.route = "profile";
    }, { silent: true });
    navigate("profile");
    return;
  }

  if (action === "rate-star") {
    const requestId = target.dataset.requestId;
    const score = Number(target.dataset.score) || 0;
    if (!requestId || !score) return;
    const form = document.getElementById("post-completion-review-form");
    if (!form) return;
    const inputs = form.querySelectorAll('input[name="rating"]');
    inputs.forEach((i) => { i.checked = String(i.value) === String(score); });
    const labels = form.querySelectorAll(".rating-star");
    labels.forEach((lab) => {
      const s = Number(lab.dataset.score) || 0;
      const icon = lab.querySelector("i");
      if (!icon) return;
      if (s <= score) {
        icon.classList.remove("bi-star");
        icon.classList.add("bi-star-fill", "text-warning");
      } else {
        icon.classList.remove("bi-star-fill", "text-warning");
        icon.classList.add("bi-star");
      }
    });
    return;
  }

  if (action === "remove-delivery") {
    const requestId = target.dataset.requestId;
    const deliveryId = target.dataset.deliveryId;
    if (!requestId || !deliveryId) return;
    setState((draft) => {
      const req = draft.requests.find((r) => r.id === requestId);
      if (!req || !Array.isArray(req.deliveries)) return;
      const before = req.deliveries.length;
      req.deliveries = req.deliveries.filter((d) => d.id !== deliveryId);
      draft.ui.workspaceTab = "deliverables";
      // #region debug-point A:remove-delivery
      fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "A", location: "app.js:handleClick:remove-delivery", msg: "[DEBUG] remove-delivery applied in setState", data: { requestId, deliveryId, deliveriesBefore: before, deliveriesAfter: req.deliveries.length, ts: Date.now() }, ts: Date.now() }) }).catch(() => {});
      // #endregion
    });
    showToast("Deliverable removed", "Removed from your submissions list.", "success");
    return;
  }
}

function handleSubmit(event) {
  event.preventDefault();
  let form = event && event.target ? event.target : null;
  if (!form || !form.tagName) {
    const src = event && event.srcElement;
    if (src && src.closest) form = src.closest("form");
  }
  if (form && form.tagName !== "FORM" && form.closest) {
    form = form.closest("form");
  }
  if (!form) return;

  if (form.id === "auth-form" || form.id === "signin-form" || form.id === "signup-form") {
    const fd = new FormData(form);
    if (form.id === "signup-form") {
      const newName = String(fd.get("name") || "New User").trim();
      const newEmail = String(fd.get("email") || "new@swapski.app").trim().toLowerCase();
      const newPassword = String(fd.get("password") || "");
      const handle = "@" + newName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "@newuser";
      const initials = getInitials(newName);
      const gradients = [
        { from: "#6366f1", to: "#8b5cf6" },
        { from: "#0ea5e9", to: "#6366f1" },
        { from: "#10b981", to: "#0ea5e9" },
        { from: "#f59e0b", to: "#ef4444" },
        { from: "#ec4899", to: "#8b5cf6" },
      ];
      const grad = gradients[Math.floor(Math.random() * gradients.length)];
      const newUserId = makeId("user");

      setState((draft) => {
        const newUser = {
          id: newUserId,
          name: newName,
          handle: handle,
          headline: "New member ready to swap skills",
          bio: "I just joined Swapski. Building my profile and looking for great skill exchange opportunities!",
          avatar: initials,
          gradFrom: grad.from,
          gradTo: grad.to,
          email: newEmail,
          password: newPassword,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "GMT+0",
          responseTime: "30 min",
          rating: 0,
          completedSwaps: 0,
          trustScore: 50,
          availability: "Open to swaps",
          location: "Online",
          skillsOffered: [],
          skillsWanted: [],
        };
        draft.users.push(newUser);
        draft.session.currentUserId = newUserId;
        draft.session.onboardingComplete = false;
        draft.session.onboardingStep = 0;
        draft.session.isAuthenticated = true;
        draft.session.isDemo = false;
        draft.ui.route = "onboarding";

        draft.ledger.unshift({
          id: makeId("led"),
          userId: newUserId,
          requestId: "signup_bonus",
          type: "earn",
          direction: "in",
          amount: 300,
          status: "completed",
          createdAt: new Date().toISOString(),
          description: "Welcome bonus — 300 Swap Credits for joining Swapski",
        });

        draft.notifications.unshift({
          id: makeId("note"),
          userId: newUserId,
          title: "Welcome to Swapski!",
          body: "You received 300 bonus credits. Complete your profile to unlock your first swap.",
          type: "wallet",
          createdAt: new Date().toISOString(),
          readAt: null,
          route: "dashboard",
          routeId: null,
        });
      }, { silent: true });
      showToast("Account created", `Welcome ${newName.split(" ")[0]}! You got 300 bonus credits.`, "success");
      navigate("onboarding");
      return;
    }

    if (form.id === "signin-form") {
      const inputEmail = String(fd.get("email") || "").trim().toLowerCase();
      const inputPassword = String(fd.get("password") || "");
      const seedCredentials = {
        "amaka.okafor@swapski.ng": { password: "Demo123!", userId: "user_1" },
        "maya@swapski.com": { password: "Demo123!", userId: "user_1" },
        "demo@swapski.com": { password: "Demo123!", userId: "user_1" },
        "chidi.eze@swapski.ng": { password: "Leo123!", userId: "user_2" },
        "leo@swapski.com": { password: "Leo123!", userId: "user_2" },
        "farida.balogun@swapski.ng": { password: "Sana123!", userId: "user_3" },
        "sana@swapski.com": { password: "Sana123!", userId: "user_3" },
        "tunde.bakare@swapski.ng": { password: "Rafa123!", userId: "user_4" },
        "rafael@swapski.com": { password: "Rafa123!", userId: "user_4" },
      };
      let matchedUser = state.users.find((u) => (u.email || "").toLowerCase() === inputEmail);
      let authenticated = false;
      if (matchedUser) {
        if (matchedUser.password && matchedUser.password === inputPassword) {
          authenticated = true;
        } else if (!matchedUser.password) {
          const seed = seedCredentials[inputEmail];
          if (seed && seed.userId === matchedUser.id && seed.password === inputPassword) {
            authenticated = true;
            setState((draft) => {
              const u = draft.users.find((x) => x.id === matchedUser.id);
              if (u) u.password = seed.password;
            }, { silent: true });
            matchedUser = state.users.find((u) => (u.email || "").toLowerCase() === inputEmail) || matchedUser;
          }
        }
      }
      if (!matchedUser) {
        const seed = seedCredentials[inputEmail];
        if (seed && seed.password === inputPassword) {
          matchedUser = state.users.find((u) => u.id === seed.userId);
          if (matchedUser) {
            authenticated = true;
            setState((draft) => {
              const u = draft.users.find((x) => x.id === seed.userId);
              if (u) {
                u.email = inputEmail;
                u.password = seed.password;
              }
            }, { silent: true });
            matchedUser = state.users.find((u) => u.id === seed.userId) || matchedUser;
          }
        }
      }
      if (!matchedUser || !authenticated) {
        showToast("Invalid credentials", "If this is an older saved session, try the Demo account or create a new Sign up.", "error");
        return;
      }
      setState((draft) => {
        draft.session.currentUserId = matchedUser.id;
        draft.session.isAuthenticated = true;
        draft.session.onboardingComplete = true;
        draft.session.isDemo = matchedUser.id === "user_1";
        draft.ui.route = "dashboard";
      }, { silent: true });
      navigate("dashboard");
      showToast("Signed in", `Welcome back, ${matchedUser.name.split(" ")[0]}!`, "success");
      return;
    }

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
    return;
  }

  if (form.id === "edit-profile-form") {
    const formData = new FormData(form);
    setState((draft) => {
      const user = draft.users.find((item) => item.id === draft.session.currentUserId);
      if (user) {
        const newName = String(formData.get("name") || user.name).trim();
        user.name = newName;
        user.headline = String(formData.get("headline") || user.headline).trim();
        user.bio = String(formData.get("bio") || user.bio).trim();
        user.location = String(formData.get("location") || user.location).trim();
        user.timezone = String(formData.get("timezone") || user.timezone).trim();
        user.avatar = getInitials(newName);
        const offered = String(formData.get("skillsOffered") || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (offered.length) user.skillsOffered = offered;
        const wanted = String(formData.get("skillsWanted") || "").split(",").map((s) => s.trim()).filter(Boolean);
        if (wanted.length) user.skillsWanted = wanted;
        const picUrl = String(formData.get("profilePic") || "").trim();
        if (picUrl) {
          user.profilePic = picUrl;
        } else if ("profilePic" in user) {
          delete user.profilePic;
        }
        const gradFrom = String(formData.get("gradFrom") || "").trim();
        const gradTo = String(formData.get("gradTo") || "").trim();
        if (gradFrom) user.gradFrom = gradFrom;
        if (gradTo) user.gradTo = gradTo;
      }
      draft.ui.showEditProfile = false;
    });
    showToast("Profile updated", "Your changes have been saved successfully.", "success");
    return;
  }

  if (form.id === "submit-delivery-form") {
    const formData = new FormData(form);
    const requestId = String(formData.get("requestId") || "");
    if (!requestId) return;
    const request = state.requests.find((r) => r.id === requestId);
    if (!request) return;
    const currentUser = getCurrentUser();
    const service = state.services.find((s) => s.id === request.serviceId);
    const requester = getUser(request.requesterId);

    const deliveryLink = String(formData.get("deliveryLink") || "").trim();
    const deliveryNote = String(formData.get("deliveryNote") || "").trim();
    const attachmentFile = formData.get("attachment");

    const deliveryId = makeId("dlv");
    const now = new Date().toISOString();
    const delivery = {
      id: deliveryId,
      requestId,
      by: currentUser.id,
      at: now,
      link: deliveryLink || null,
      note: deliveryNote || null,
      fileName: null,
      fileSize: null,
      fileType: null,
    };

    const systemParts = [];
    if (deliveryLink) systemParts.push(`Link: ${deliveryLink}`);

    if (attachmentFile && attachmentFile instanceof File && attachmentFile.name) {
      delivery.fileName = attachmentFile.name;
      delivery.fileSize = attachmentFile.size;
      delivery.fileType = attachmentFile.type || "application/octet-stream";
      systemParts.push(`Attached: ${attachmentFile.name} (${formatBytes(attachmentFile.size)})`);
    }

    if (deliveryNote) systemParts.push(`Note: ${deliveryNote}`);
    if (systemParts.length === 0) {
      showToast("Nothing to deliver", "Add a link, attach a file, or write a note before submitting.", "warning");
      return;
    }

    setState((draft) => {
      const req = draft.requests.find((r) => r.id === requestId);
      if (!req) return;
      if (!req.deliveries) req.deliveries = [];
      req.deliveries.push(delivery);
      req.status = "review";
      if (!req.checklist) req.checklist = {};
      req.checklist.chk_scope = true;
      req.checklist.chk_refs = true;
      req.checklist.chk_draft = true;
      req.checklist.chk_submit = true;

      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: "system",
        body: `Delivery submitted for review. ${systemParts.join(" • ")}`,
        createdAt: now,
      });

      if (deliveryNote) {
        draft.messages.push({
          id: makeId("msg"),
          requestId,
          senderId: currentUser.id,
          body: deliveryNote,
          createdAt: now,
        });
      }

      draft.ui.showSubmitDelivery = false;
      draft.ui.submitDeliveryRequestId = null;

      draft.notifications.unshift({
        id: makeId("note"),
        userId: request.requesterId,
        title: "Delivery ready for review",
        body: `${currentUser.name} submitted delivery for "${service?.title || "your task"}". Review and approve to release credits.`,
        type: "swap",
        createdAt: now,
        readAt: null,
        route: "tasks",
        routeId: null,
      });
      draft.notifications.unshift({
        id: makeId("note"),
        userId: currentUser.id,
        title: "Delivery submitted",
        body: `Your delivery for "${service?.title || "the task"}" is now in review. Waiting for ${requester?.name || "the requester"} to approve.`,
        type: "swap",
        createdAt: now,
        readAt: null,
        route: "tasks",
        routeId: null,
      });
    });
    showToast("Delivery submitted", "Waiting for the requester to review and approve.", "success");
    scheduleAIReview(requestId);
    return;
  }

  if (form.id === "ai-question-form") {
    const fd = new FormData(form);
    const requestId = String(fd.get("requestId") || "");
    const question = String(fd.get("question") || "").trim();
    if (!requestId || !question) return;
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return;
    const service = state.services.find((s) => s.id === req.serviceId);
    const brief = generateTaskBrief(service || { category: "Design" }, req.requesterId, getUser(req.providerId)?.name || "You");
    const answer = aiAnswer(question, { request: req, service, brief });
    setState((draft) => {
      if (!draft.ui.aiAssistantChat) draft.ui.aiAssistantChat = {};
      if (!draft.ui.aiAssistantChat[requestId]) draft.ui.aiAssistantChat[requestId] = [];
      draft.ui.aiAssistantChat[requestId].push({ role: "user", body: question });
      draft.ui.aiAssistantChat[requestId].push({ role: "ai", body: answer });
      draft.ui.workspaceTab = "ai";
      draft.ui.showWorkspace = true;
      draft.ui.workspaceRequestId = requestId;
    });
    return;
  }

  if (form.id === "workspace-chat-form") {
    const fd = new FormData(form);
    const requestId = String(fd.get("requestId") || "");
    const message = String(fd.get("message") || "").trim();
    if (!requestId || !message) return;
    const me = getCurrentUser();
    setState((draft) => {
      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: me.id,
        body: message,
        createdAt: new Date().toISOString(),
      });
    });
    const chatRequest = state.requests.find((item) => item.id === requestId);
    if (state.session.isDemo && chatRequest && (isAIUser(chatRequest.requesterId) || isAIUser(chatRequest.providerId))) {
      const otherId = me.id === chatRequest.requesterId ? chatRequest.providerId : chatRequest.requesterId;
      if (isAIUser(otherId)) {
        setTimeout(() => {
          const persona = AI_PERSONAE[otherId] || { signoff: "" };
          const replies = [
            "Sounds good! Let me know if anything in the brief is unclear.",
            "Got it. I'll review what you sent and get back shortly.",
            "Perfect — reference assets are all downloaded. Move forward when ready.",
            "Nice, scope aligns. Tag me in the Deliverables tab when the first draft is up.",
            "Yep, all clear. Use the Deliverables tab when the work is ready so I can approve and release.",
          ];
          setState((draft) => {
            draft.messages.push({
              id: makeId("msg"),
              requestId,
              senderId: otherId,
              body: `${replies[Math.floor(Math.random() * replies.length)]}\n\n${persona.signoff || ""}`,
              createdAt: new Date().toISOString(),
            });
          });
        }, 1500);
      }
    }
    return;
  }

  if (form.id === "workspace-delivery-form") {
    const fd = new FormData(form);
    const requestId = String(fd.get("requestId") || "");
    if (!requestId) return;
    const me = getCurrentUser();
    const deliveryLink = String(fd.get("deliveryLink") || "").trim();
    const deliveryNote = String(fd.get("deliveryNote") || "").trim();
    const attachment = fd.get("attachment");
    // #region debug-point A:delivery-form-entry
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "A", location: "app.js:handleSubmit:workspace-delivery-form:entry", msg: "[DEBUG] workspace-delivery-form submit fired", data: { requestId, deliveryLinkLen: deliveryLink.length, deliveryNoteLen: deliveryNote.length, fileName: attachment?.name || null, fileSize: attachment?.size || 0, currentUserId: me.id, ts: Date.now() }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    if (!deliveryLink && !(attachment && attachment.name)) {
      // #region debug-point A:delivery-empty
      fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "A", location: "app.js:handleSubmit:workspace-delivery-form:empty", msg: "[DEBUG] delivery form empty — no link or file provided", data: { requestId }, ts: Date.now() }) }).catch(() => {});
      // #endregion
      showToast("Nothing to save", "Paste a link or attach a file.", "warning");
      return;
    }
    const now = new Date().toISOString();
    setState((draft) => {
      const req = draft.requests.find((r) => r.id === requestId);
      if (!req) return;
      if (!req.deliveries) req.deliveries = [];
      const entry = {
        id: makeId("dlv"),
        requestId,
        by: me.id,
        at: now,
        link: deliveryLink || null,
        note: deliveryNote || null,
        fileName: null,
        fileSize: null,
        fileType: null,
      };
      if (attachment && attachment.name) {
        entry.fileName = attachment.name;
        entry.fileSize = attachment.size || 0;
        entry.fileType = attachment.type || "application/octet-stream";
      }
      req.deliveries.push(entry);
      if (!req.checklist) req.checklist = {};
      req.checklist.chk_scope = true;
      req.checklist.chk_refs = true;
      req.checklist.chk_draft = true;
      req.checklist.chk_submit = true;
      draft.ui.workspaceTab = "deliverables";
    });
    try { form.reset(); } catch {}
    // #region debug-point A:delivery-after-setState
    const latest = (state.requests.find(r => r.id === requestId)?.deliveries || []).slice(-1)[0] || null;
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "A", location: "app.js:handleSubmit:workspace-delivery-form:post-state", msg: "[DEBUG] after setState persist, last delivery on state", data: { requestId, lastEntry: latest ? { id: latest.id, link: !!latest.link, fileName: latest.fileName, by: latest.by } : null, deliveriesAll: (state.requests.find(r => r.id === requestId)?.deliveries || []).length }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    showToast("Saved to Deliverables", "Added to the task. Use Submit Task when everything is ready.", "success");
    return;
  }

  if (form.id === "post-completion-review-form") {
    const fd = new FormData(form);
    const requestId = String(fd.get("requestId") || "");
    const score = Number(fd.get("rating") || 0);
    const reviewText = String(fd.get("reviewText") || "").trim();
    if (!requestId) return;
    const req = state.requests.find((r) => r.id === requestId);
    if (!req) return;
    const me = getCurrentUser();
    const subjectId = me.id === req.requesterId ? req.providerId : req.requesterId;
    // #region debug-point D5:review-form-entry
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "D5", location: "app.js:handleSubmit:post-completion-review-form:entry", msg: "[DEBUG] post-completion-review submit fired", data: { requestId, score, reviewTextLen: reviewText.length, currentUserId: me.id, subjectId, prevReviewExists: !!(state.reviews.find((r) => r.requestId === requestId && r.authorId === me.id && r.subjectId === subjectId)), reviewsLen: state.reviews.length, ts: Date.now() }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    setState((draft) => {
      const existing = draft.reviews.find(
        (r) => r.requestId === requestId && r.authorId === me.id && r.subjectId === subjectId
      );
      if (!existing) {
        draft.reviews.unshift({
          id: makeId("rev"),
          requestId,
          authorId: me.id,
          subjectId,
          score: score || 5,
          review: reviewText || "Great swap — clear communication and delivery!",
        });
      } else {
        if (score) existing.score = score;
        if (reviewText) existing.review = reviewText;
      }
      draft.ui.showTaskCompleted = false;
      draft.ui.completedRequestId = null;
      draft.ui.route = "tasks";
      // #region debug-point D5:review-form-setState-inside
      fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "D5", location: "app.js:handleSubmit:post-completion-review-form:setState", msg: "[DEBUG] review persisted, showTaskCompleted=false, navigating to tasks", data: { requestId, reviewsNow: draft.reviews.length, newReviewAuthor: draft.reviews[0]?.authorId, newReviewScore: draft.reviews[0]?.score }, ts: Date.now() }) }).catch(() => {});
      // #endregion
    }, { silent: true });
    showToast("Review saved", "Thanks for sharing your feedback — it helps keep the community trustworthy.", "success");
    navigate("tasks");
    return;
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
    draft.session.onboardingComplete = true;
    draft.ui.route = "dashboard";
  }, { silent: true });
  navigate("dashboard");
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
  // #region debug-point E:approve-entry
  fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "E", location: "app.js:approveRequest:entry", msg: "[DEBUG] approveRequest called", data: { requestId, requestStatus: request.status, creditAmount: request.creditAmount, requesterId: request.requesterId, providerId: request.providerId, ts: Date.now() }, ts: Date.now() }) }).catch(() => {});
  // #endregion
  const service = state.services.find((item) => item.id === request.serviceId);
  const provider = getUser(request.providerId);

  setState((draft) => {
    const requestDraft = draft.requests.find((item) => item.id === requestId);
    requestDraft.status = "completed";

    const lockEntry = draft.ledger.find((entry) => entry.requestId === requestId && (entry.type === "lock" || entry.kind === "escrow_lock") && entry.userId === request.requesterId);
    if (lockEntry) {
      lockEntry.status = "completed";
      if (!lockEntry.type) lockEntry.type = "lock";
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
    const builtin = draft.reviews.find(
      (r) => r.authorId === request.requesterId && r.subjectId === request.providerId && r.requestId === requestId
    );
    if (!builtin) {
      draft.reviews.unshift({
        id: makeId("rev"),
        requestId,
        authorId: request.requesterId,
        subjectId: request.providerId,
        score: 5,
        review: `${provider.name} delivered clearly and on time. Great communication throughout the swap.`,
      });
    }

    const prov = draft.users.find((u) => u.id === request.providerId);
    if (prov) {
      const provReviews = draft.reviews.filter((r) => r.subjectId === prov.id);
      prov.completedSwaps = (prov.completedSwaps || 0) + 1;
      if (provReviews.length) {
        const totalScore = provReviews.reduce((sum, r) => sum + (Number(r.score) || 0), 0);
        prov.rating = Math.round((totalScore / provReviews.length) * 10) / 10;
      }
      prov.trustScore = Math.min(100, 50 + prov.completedSwaps * 4 + (provReviews.length ? Math.floor(prov.rating || 0) * 4 : 0));
    }
    // #region debug-point E:approve-setState-done
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "E", location: "app.js:approveRequest:setState-done", msg: "[DEBUG] approveRequest setState block finished applying", data: { requestId, newStatus: requestDraft.status, ledgerLen: draft.ledger.length, reviewsLen: draft.reviews.length, providerCompleted: prov?.completedSwaps || null, providerRating: prov?.rating || null, providerTrust: prov?.trustScore || null }, ts: Date.now() }) }).catch(() => {});
    // #endregion
  });

  showToast("Credits released", "Approval is complete and the ledger updated on both sides.", "success");
  // #region debug-point E:approve-opening-taskcompleted
  fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "E", location: "app.js:approveRequest:post-success", msg: "[DEBUG] approveRequest calling openTaskCompleted", data: { requestId, walletProviderNow: getWalletMetrics(request.providerId), walletRequesterNow: getWalletMetrics(request.requesterId) }, ts: Date.now() }) }).catch(() => {});
  // #endregion
  openTaskCompleted(requestId);
}

function openTaskCompleted(requestId) {
  if (!requestId) return;
  // #region debug-point E:openTC-entry
  fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "E", location: "app.js:openTaskCompleted:entry", msg: "[DEBUG] openTaskCompleted firing setState", data: { requestId, prevShowTaskCompleted: state.ui.showTaskCompleted, prevShowWorkspace: state.ui.showWorkspace, ts: Date.now() }, ts: Date.now() }) }).catch(() => {});
  // #endregion
  setState((draft) => {
    draft.ui.showWorkspace = false;
    draft.ui.workspaceRequestId = null;
    draft.ui.showTaskCompleted = true;
    draft.ui.completedRequestId = requestId;
  });
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
  const escrow = sum(entries.filter((entry) => (entry.type === "lock" || entry.kind === "escrow_lock") && entry.status === "pending").map((entry) => entry.amount));
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
  const me = getCurrentUser();
  const favs = Array.isArray(state.favorites) ? state.favorites : [];
  const isSaved = favs.some((f) => f.userId === me.id && f.serviceId === service.id);
  const myWallet = me ? getWalletMetrics(me.id) : { available: 0 };
  const requesterWallet = getWalletMetrics(service.userId);
  const asRequesterNeedMore = (!selfOwned && myWallet.available < service.creditCost)
    ? (service.creditCost - myWallet.available)
    : 0;
  const asProviderNeedMore = (!selfOwned && requesterWallet.available < service.creditCost)
    ? (service.creditCost - requesterWallet.available)
    : 0;
  const bookDisabled = selfOwned || asRequesterNeedMore > 0;
  const acceptDisabled = selfOwned || asProviderNeedMore > 0;
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
        <div class="w-100 mt-3">
          ${asProviderNeedMore > 0 ? `<div class="alert-soft alert-warn mt-0 mb-3 small"><i class="bi bi-exclamation-triangle me-1"></i> Client posting the work (${owner.name}) needs ${formatCredits(asProviderNeedMore)} more to lock escrow — you can't start until they top up.</div>` : ""}
          ${asRequesterNeedMore > 0 ? `<div class="alert-soft alert-warn mt-0 mb-3 small"><i class="bi bi-wallet2 me-1"></i> You need ${formatCredits(asRequesterNeedMore)} more credits to lock ${formatCredits(service.creditCost)} in escrow to book this.</div>` : ""}
          <div class="inline-actions">
            <span class="badge-soft">${service.deliveryTime}</span>
            <button class="btn-ghost round-icon ${isSaved ? "saved" : ""}" data-action="${isSaved ? "unsave-service" : "save-service"}" data-service-id="${service.id}" title="${isSaved ? "Remove from Saved" : "Save to Saved"}" aria-label="${isSaved ? "Unsave service" : "Save service"}">
              <i class="bi bi-bookmark${isSaved ? "-check-fill text-cyan" : ""}"></i>
            </button>
            ${!selfOwned ? `
              <button class="btn-outline-soft" data-action="book-service" data-service-id="${service.id}" ${bookDisabled ? "disabled" : ""} title="${selfOwned ? "This is your listing" : (asRequesterNeedMore > 0 ? `Top up ${formatCredits(asRequesterNeedMore)} more credits to lock escrow` : "Request this service — you lock credits into escrow, the provider delivers work")}">
                <i class="bi bi-cart-plus me-1"></i>${bookDisabled ? (selfOwned ? "Your listing" : `Need ${formatCredits(asRequesterNeedMore)}`) : "Request (lock escrow)"}
              </button>
            ` : ""}
            <button class="btn-gradient" data-action="${selfOwned ? "open-request-modal" : "accept-offer"}" data-service-id="${service.id}" ${acceptDisabled ? "disabled" : ""} title="${selfOwned ? "This is your listing" : (asProviderNeedMore > 0 ? `Client (${owner.name}) needs ${formatCredits(asProviderNeedMore)} more credits in escrow first` : "I can deliver this work — earn credits when the job is approved")}">
              ${selfOwned ? "Your service" : (acceptDisabled ? `Need ${formatCredits(asProviderNeedMore)}` : '<i class="bi bi-briefcase me-1"></i>I can deliver')}
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function compactService(service, selfOwned = false) {
  const user = getUser(service.userId);
  const me = getCurrentUser();
  const myWallet = me ? getWalletMetrics(me.id) : { available: 0 };
  const needMore = (!selfOwned && myWallet.available < service.creditCost)
    ? (service.creditCost - myWallet.available)
    : 0;
  const requestDisabled = selfOwned || needMore > 0;
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
      ${needMore > 0 ? `<div class="alert-soft alert-warn mt-3 small"><i class="bi bi-wallet2 me-1"></i> You need ${formatCredits(needMore)} more to lock ${formatCredits(service.creditCost)} in escrow.</div>` : ""}
      <div class="inline-actions mt-3">
        <span class="badge-soft">${service.deliveryTime}</span>
        ${!selfOwned ? `<button class="btn-outline-soft" data-action="book-service" data-service-id="${service.id}" ${requestDisabled ? "disabled" : ""} title="${needMore > 0 ? `Top up ${formatCredits(needMore)} credits first` : "Request service — credits lock into escrow until work is delivered"}">${requestDisabled ? `Need ${formatCredits(needMore)}` : "Request service"}</button>` : ""}
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
      ${Array.isArray(request.deliveries) && request.deliveries.length ? `
        <div class="glass-card-soft p-3 mb-3">
          <div class="eyebrow mb-2">Latest delivery (${request.deliveries.length} total)</div>
          ${(function () {
            const d = request.deliveries[request.deliveries.length - 1];
            const parts = [];
            if (d.link) parts.push(`<a href="${d.link}" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: underline; word-break: break-all;">Link to work</a>`);
            if (d.fileName) parts.push(`<span class="badge-soft ms-2"><i class="bi bi-paperclip me-1"></i>${d.fileName}</span>`);
            return `<div class="d-flex align-items-center flex-wrap gap-2">
              ${parts.join("")}
              <span class="x-small muted ms-auto">${formatDateTime(d.at)}</span>
            </div>`;
          })()}
        </div>
      ` : ""}
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
      <button class="btn-gradient w-100 mt-3" data-action="open-workspace" data-request-id="${request.id}" data-tab="overview">
        <i class="bi bi-diagram-3 me-1"></i> Open Full Project Workspace
      </button>
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
    return `<button class="btn-gradient" data-action="open-submit-delivery" data-request-id="${request.id}">
      <i class="bi bi-cloud-arrow-up pe-1"></i> Submit delivery
    </button>`;
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
  const deliveries = Array.isArray(summary.request.deliveries) ? summary.request.deliveries : [];
  return `
    <div class="card-header-row">
      <div>
        <div class="eyebrow">${summary.partner.name}</div>
        <h3 class="mt-3 mb-1">${summary.service?.title || "Conversation"}</h3>
      </div>
      <div class="d-flex gap-2 align-items-center flex-wrap">
        <button class="btn-outline-soft" data-action="open-workspace" data-request-id="${summary.request.id}" data-tab="overview">
          <i class="bi bi-diagram-3 me-1"></i> Workspace
        </button>
        <span class="status-chip ${summary.request.status}">${prettyStatus(summary.request.status)}</span>
      </div>
    </div>
    <p class="muted mt-3">Credits locked: ${formatCredits(summary.request.creditAmount)} • due ${formatDate(summary.request.dueAt)}</p>
    ${deliveries.length ? `
      <div class="glass-card-soft p-3 mt-4">
        <div class="card-header-row mb-2">
          <div class="eyebrow mb-0">Deliveries (${deliveries.length})</div>
        </div>
        <div class="content-stack gap-2">
          ${deliveries.map((d) => `
            <div class="d-flex gap-2 align-items-start p-2 rounded-2" style="background: rgba(99, 102, 241, 0.08);">
              <div class="icon-bubble" style="background: linear-gradient(135deg, #6366f1, #8b5cf6);">
                <i class="bi ${d.link ? "bi-link-45deg" : "bi-file-earmark-text"} text-white"></i>
              </div>
              <div class="flex-grow-1">
                <div class="d-flex gap-2 flex-wrap align-items-center">
                  ${d.link ? `<a href="${d.link}" target="_blank" rel="noopener" class="fw-semibold text-decoration-none" style="color: var(--accent);">${d.link}</a>` : ""}
                  ${d.fileName ? `<span class="badge-soft"><i class="bi bi-paperclip me-1"></i>${d.fileName}${d.fileSize ? ` (${formatBytes(d.fileSize)})` : ""}</span>` : ""}
                </div>
                ${d.note ? `<div class="muted mt-1 x-small">${d.note}</div>` : ""}
                <div class="x-small muted mt-1">Submitted ${formatDateTime(d.at)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    ` : ""}
    <div class="message-list mt-4">
      ${summary.messages
        .map((message) => {
          if (message.senderId === "system") {
            const bodyWithLinks = (message.body || "").replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: underline;">$1</a>');
            return `<div class="system-bubble">${bodyWithLinks}</div>`;
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
  const me = getCurrentUser();
  const isRequester = request.requesterId === me.id;
  const partnerId = isRequester ? request.providerId : request.requesterId;
  const partner = getUser(partnerId);
  return `
    <article class="task-card">
      <div class="task-card-topline"><span class="task-category">${service?.category || "Swap"}</span><span class="task-credit"><i class="bi bi-lightning-charge-fill"></i> ${formatCredits(request.creditAmount)}</span></div>
      <strong class="task-card-title">${service?.title || "Service request"}</strong>
      <div class="task-partner mt-3"><span class="avatar-ring">${partner?.avatar || "?"}</span><span><b>${partner?.name || "Partner"}</b><small>${isRequester ? "Service provider" : "Requester"}</small></span></div>
      <div class="task-due-row"><span><i class="bi bi-calendar3"></i> Due ${formatDate(request.dueAt)}</span><span class="status-chip ${request.status}">${prettyStatus(request.status)}</span></div>
      <div class="inline-actions mt-3 flex-wrap gap-2">
        <button class="btn-outline-soft" data-action="open-conversation" data-conversation-id="${request.id}">
          <i class="bi bi-chat-dots me-1"></i> Chat
        </button>
      </div>
      <div class="task-card-actions mt-3">
        ${renderRequestActions(request, isRequester)}
      </div>
      <button class="btn-gradient w-100 mt-2 task-open-button" data-action="open-workspace" data-request-id="${request.id}" data-tab="overview">
        Open workspace <i class="bi bi-arrow-up-right"></i>
      </button>
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
  const homeRoute = state.session.isAuthenticated ? "dashboard" : "landing";
  return `
    <div class="brand-lockup" style="cursor:pointer;" data-route="${homeRoute}">
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

function getInitials(name) {
  if (!name) return "SU";
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => (w[0] || "").toUpperCase())
    .join("");
}

function truncate(text, max = 120) {
  if (!text) return "";
  const s = String(text);
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trim()}…`;
}

function formatDateTime(value) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
  } catch {
    return String(value);
  }
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function renderDemoTourBanner() {
  if (!state.session.isDemo || state.ui.demoTourDismissed) return "";
  const step = Number(state.ui.demoTourStep || 0);
  if (step < 1 || step > DEMO_TOUR_STEPS.length) return "";
  const s = DEMO_TOUR_STEPS[step - 1];
  return `
    <div class="demo-tour-banner">
      <div class="flex-shrink-0 me-3">
        <div class="tour-step-bubble">${step}/${DEMO_TOUR_STEPS.length}</div>
      </div>
      <div class="flex-grow-1">
        <div class="fw-semibold text-gradient">${s.title}</div>
        <div class="muted mt-1">${s.body}</div>
      </div>
      <div class="d-flex gap-2 ms-3 align-items-center flex-wrap">
        <button class="btn-outline-soft" data-action="demo-tour-dismiss">Dismiss</button>
        <button class="btn-gradient" data-action="demo-tour-next">${s.cta} <i class="bi bi-arrow-right ms-2"></i></button>
      </div>
    </div>
  `;
}

function startDemoTour() {
  const scheduleStep = (index, delay) =>
    setTimeout(() => {
      const step = Number(state.ui.demoTourStep || 0);
      if (state.session.isDemo && !state.ui.demoTourDismissed && step === index + 1) {
        const s = DEMO_TOUR_STEPS[index];
        showToast(s.title, s.body, "success");
      }
    }, delay);
  DEMO_TOUR_STEPS.forEach((_, i) => scheduleStep(i, 1200 + i * 400));
}

function calculateDemoProgress(request) {
  const phase = { discover: true };
  const statuses = ["accepted", "in_progress", "review", "completed"];
  phase.accept = statuses.includes(request.status);
  const userIds = [request.requesterId, request.providerId];
  const aiBriefMessages = state.messages.filter((m) => m.requestId === request.id && m.senderId !== "system");
  phase.brief = aiBriefMessages.length >= 1;
  const chatCount = state.messages.filter((m) => m.requestId === request.id && m.senderId !== "system").length;
  phase.chat = chatCount >= 1;
  const deliveries = Array.isArray(request.deliveries) ? request.deliveries : [];
  const userDeliveries = deliveries.filter((d) => !d.isReference);
  phase.work = userDeliveries.length >= 1;
  phase.submit = request.status === "review" || request.status === "completed";
  phase.review = request.status === "review" || request.status === "completed";
  phase.release = request.status === "completed";
  phase.earn = request.status === "completed";
  phase.review_given = !!state.reviews.find(
    (r) => r.requestId === request.id && (userIds.includes(r.authorId) || userIds.includes(r.subjectId))
  );
  phase.done = request.status === "completed" && phase.review_given;
  return phase;
}

function renderProgressGuide(phase, requestId) {
  const keys = PROGRESS_PHASES.map((p) => p.key);
  const currentIdx = Math.max(
    0,
    [...keys].reverse().findIndex((k) => !!phase[k]) < 0 ? 0 : keys.length - 1 - [...keys].reverse().findIndex((k) => !!phase[k])
  );
  return `
    <div class="progress-ribbon">
      ${PROGRESS_PHASES.map((p, i) => {
        const active = !!phase[p.key];
        const isCurrent = i === currentIdx && active;
        return `
          <div class="progress-pip ${active ? "active" : ""} ${isCurrent ? "current" : ""}" title="${p.label}" data-action="jump-phase" data-phase="${p.key}" data-request-id="${requestId}">
            <i class="bi ${p.icon}"></i>
            <span>${p.label}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderWorkspaceOverview(ctx) {
  const { request, service, isProvider, partner, requester, provider, references, userDeliveries, brief, checklist } = ctx;
  const dueDate = formatDate(request.dueAt);
  const completed = checklist.filter((c) => c.checked).length;
  const percent = Math.round((completed / checklist.length) * 100);
  return `
    <div class="workspace-grid">
      <section class="glass-card-soft p-4">
        <div class="eyebrow">Project brief</div>
        <h3 class="mt-3 mb-2">${service?.title || "Project brief"}</h3>
        <p class="muted">${service?.description || ""}</p>
        <div class="chip-row mb-3">
          ${(service?.tags || []).map((t) => `<span class="badge-soft">${t}</span>`).join("")}
          <span class="badge-soft"><i class="bi bi-calendar me-1"></i>Due ${dueDate}</span>
          <span class="badge-soft"><i class="bi bi-people me-1"></i>${service?.deliveryTime || "Standard"}</span>
          <span class="badge-soft"><i class="bi bi-arrow-repeat me-1"></i>${service?.revisions ?? 2} revision${(service?.revisions ?? 2) === 1 ? "" : "s"}</span>
        </div>
        <p style="white-space: pre-line;">${brief.body}</p>
      </section>
      <div class="content-stack">
        <div class="glass-card-soft p-4">
          <div class="card-header-row mb-3">
            <div>
              <div class="eyebrow">Your checklist</div>
              <h4 class="mt-3 mb-1">${completed}/${checklist.length} complete</h4>
            </div>
            <span class="badge-soft">${percent}%</span>
          </div>
          <div class="progress-bar mb-3" style="height: 8px;">
            <div class="progress-fill" style="width: ${percent}%;"></div>
          </div>
          <div class="content-stack gap-2">
            ${checklist.map((c) => `
              <label class="checklist-item">
                <input type="checkbox" ${c.checked ? "checked" : ""} data-action="toggle-checklist" data-check-id="${c.id}" data-request-id="${request.id}" />
                <span>${c.label}</span>
              </label>
            `).join("")}
          </div>
        </div>
        <div class="glass-card-soft p-4">
          <div class="eyebrow">People</div>
          <div class="content-stack gap-3 mt-3">
            <div class="d-flex align-items-center gap-3">
              <div class="avatar-ring" style="width: 48px; height: 48px; font-size: 14px;">${getInitials(requester?.name || "R")}</div>
              <div>
                <strong>${requester?.name || "Requester"}</strong>
                <div class="muted">Pays the credits · ${requester?.location || "Online"}</div>
              </div>
              <span class="badge-soft ms-auto">${requester?.trustScore || 50} trust</span>
            </div>
            <div class="d-flex align-items-center gap-3">
              <div class="avatar-ring" style="width: 48px; height: 48px; font-size: 14px;">${getInitials(provider?.name || "P")}</div>
              <div>
                <strong>${provider?.name || "Provider"}</strong>
                <div class="muted">Does the work · ${provider?.location || "Online"}</div>
              </div>
              <span class="badge-soft ms-auto">${provider?.trustScore || 50} trust</span>
            </div>
          </div>
        </div>
        <div class="glass-card-soft p-4">
          <div class="eyebrow">Quick actions</div>
          <div class="content-stack mt-3 gap-2">
            <button class="btn-gradient w-100" data-action="switch-workspace-tab" data-tab="ai" data-request-id="${request.id}">
              <i class="bi bi-lightbulb me-2"></i> Ask AI about the project
            </button>
            ${isProvider ? `
              <button class="btn-outline-soft w-100" data-action="switch-workspace-tab" data-tab="deliverables" data-request-id="${request.id}">
                <i class="bi bi-folder2-open me-2"></i> Upload deliverables
              </button>
            ` : `
              <button class="btn-outline-soft w-100" data-action="switch-workspace-tab" data-tab="chat" data-request-id="${request.id}">
                <i class="bi bi-chat-dots me-2"></i> Message ${provider?.name || "Provider"}
              </button>
            `}
            <button class="btn-outline-soft w-100" data-action="switch-workspace-tab" data-tab="escrow" data-request-id="${request.id}">
              <i class="bi bi-shield-lock me-2"></i> View escrow & ledger
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderWorkspaceAI(ctx) {
  const { request, service, brief, aiChat, isProvider, checklist } = ctx;
  const qaSuggestions = [
    "Summarize the project goals in 3 bullets",
    "What files do I need to deliver?",
    "Am I on track for the deadline?",
    "Write a checklist for the final submission",
    "How should I name my deliverables?",
  ];
  return `
    <div class="workspace-grid">
      <div class="glass-card-soft p-4 ai-hero">
        <div class="d-flex align-items-center gap-3 mb-3">
          <div class="icon-bubble" style="background: linear-gradient(135deg, #8b5cf6, #ec4899);">
            <i class="bi bi-sparkles text-white"></i>
          </div>
          <div>
            <h3 class="mb-1">AI Project Assistant</h3>
            <div class="muted">I read the brief and can answer questions about scope, deliverables, and the suggested workflow.</div>
          </div>
        </div>
        <div class="chip-row mb-3">
          ${qaSuggestions.map((s) => `<button class="chip-suggestion" data-action="ai-suggest" data-question="${s.replace(/"/g, "&quot;")}" data-request-id="${request.id}">${s}</button>`).join("")}
        </div>
        <form id="ai-question-form" class="mt-3">
          <input type="hidden" name="requestId" value="${request.id}" />
          <div class="input-group">
            <input class="form-control" name="question" placeholder="Ask Swapski AI about requirements, scope, references, or workflow…" />
            <button class="btn-gradient" type="submit"><i class="bi bi-send me-1"></i> Ask</button>
          </div>
        </form>
      </div>
      <div class="content-stack">
        <div class="glass-card-soft p-4">
          <div class="eyebrow">AI checklist</div>
          <h4 class="mt-3 mb-3">Deliverables & workflow</h4>
          <div class="content-stack gap-2">
            ${checklist.map((c) => `
              <label class="checklist-item">
                <input type="checkbox" ${c.checked ? "checked" : ""} data-action="toggle-checklist" data-check-id="${c.id}" data-request-id="${request.id}" />
                <span>${c.label}</span>
              </label>
            `).join("")}
          </div>
        </div>
        <div class="glass-card-soft p-4">
          <div class="eyebrow">Conversation</div>
          <h4 class="mt-3 mb-3">Q&A with AI</h4>
          <div class="ai-chat-list">
            ${aiChat.length === 0 ? `
              <div class="muted text-center py-4">Ask your first question above — or pick a suggested shortcut. I'll keep the chat organized here.</div>
            ` : aiChat.map((m) => `
              <div class="ai-chat-row ${m.role}">
                <div class="ai-chat-bubble">
                  ${m.role === "user" ? `<strong>You:</strong>` : `<strong style="color: var(--accent);">AI:</strong>`}
                  <div style="white-space: pre-line;">${m.body}</div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderWorkspaceChat(ctx) {
  const { request, service, partner, isProvider } = ctx;
  const summary = getConversationSummaries().find((s) => s.request.id === request.id);
  if (summary) return renderConversationPanel(summary) + `
    <form id="workspace-chat-form" class="chat-input-shell glass-card-soft mt-3">
      <input type="hidden" name="requestId" value="${request.id}" />
      <input class="form-control" name="message" placeholder="Message ${partner?.name || "partner"} about this swap…" />
      <button class="btn-gradient" type="submit">Send</button>
    </form>
  `;
  return `<div class="muted p-4">No messages yet.</div>`;
}

function renderWorkspaceDeliverables(ctx) {
  const { request, service, isProvider, references, userDeliveries, checklist } = ctx;
  return `
    <div class="workspace-grid">
      <div class="content-stack">
        <div class="glass-card-soft p-4">
          <div class="card-header-row mb-3">
            <div>
              <div class="eyebrow">Your deliverables</div>
              <h3 class="mt-3 mb-1">Submitted work</h3>
            </div>
            <span class="badge-soft">${userDeliveries.length} file / link submission${userDeliveries.length === 1 ? "" : "s"}</span>
          </div>
          <div class="content-stack gap-3">
            ${userDeliveries.length === 0 ? `<div class="muted p-3">Nothing submitted yet. Upload files / paste links on the right.</div>` :
              userDeliveries.map((d) => `
              <div class="deliverable-row">
                <div class="deliverable-icon"><i class="bi ${d.link ? "bi-link-45deg" : "bi-file-earmark-text"}"></i></div>
                <div class="flex-grow-1">
                  ${d.link ? `<a href="${d.link}" target="_blank" rel="noopener" class="fw-semibold text-decoration-none" style="color: var(--accent);">${d.link}</a>` : ""}
                  ${d.fileName ? `<div class="badge-soft ms-2"><i class="bi bi-paperclip me-1"></i>${d.fileName}${d.fileSize ? ` (${formatBytes(d.fileSize)})` : ""}</div>` : ""}
                  ${d.note ? `<div class="muted mt-1 small">${d.note}</div>` : ""}
                  <div class="x-small muted mt-1">${formatDateTime(d.at)}</div>
                </div>
                ${isProvider && d.by === state.session.currentUserId ? `
                  <button class="btn-ghost round-icon" style="color: #ff5c7c;" data-action="remove-delivery" data-delivery-id="${d.id}" data-request-id="${request.id}" title="Remove this deliverable" aria-label="Remove delivery">
                    <i class="bi bi-trash"></i>
                  </button>
                ` : ""}
              </div>
            `).join("")}
          </div>
        </div>
        <div class="glass-card-soft p-4">
          <div class="card-header-row mb-3">
            <div>
              <div class="eyebrow">References from ${isProvider ? "Requester" : "Client"}</div>
              <h4 class="mt-3 mb-1">Source files & links</h4>
            </div>
            <span class="badge-soft">${references.length} reference${references.length === 1 ? "" : "s"}</span>
          </div>
          <div class="content-stack gap-3">
            ${references.length === 0 ? `<div class="muted p-3">Reference assets will appear here once the requester shares them.</div>` :
              references.map((d) => `
              <div class="deliverable-row">
                <div class="deliverable-icon ref"><i class="bi ${d.link ? "bi-link-45deg" : "bi-file-earmark-zip"}"></i></div>
                <div class="flex-grow-1">
                  ${d.link ? `<a href="${d.link}" target="_blank" rel="noopener" class="fw-semibold text-decoration-none" style="color: var(--accent);">${d.link}</a>` : ""}
                  ${d.fileName ? `<div class="badge-soft ms-2"><i class="bi bi-paperclip me-1"></i>${d.fileName}${d.fileSize ? ` (${formatBytes(d.fileSize)})` : ""}</div>` : ""}
                  ${d.note ? `<div class="muted mt-1 small">${d.note}</div>` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
      ${isProvider ? `
        <div class="content-stack">
          <div class="glass-card-soft p-4">
            <div class="eyebrow">Submit new delivery</div>
            <h3 class="mt-3 mb-3">Add a link, file, or note</h3>
            <form id="workspace-delivery-form">
              <input type="hidden" name="requestId" value="${request.id}" />
              <div class="mb-3">
                <label class="form-label" for="w-link">Link to work</label>
                <input class="form-control" id="w-link" name="deliveryLink" type="url" placeholder="https://figma.com/..." />
              </div>
              <div class="mb-3">
                <label class="form-label" for="w-file">Attach a file</label>
                <input class="form-control" id="w-file" name="attachment" type="file" />
              </div>
              <div class="mb-3">
                <label class="form-label" for="w-note">Delivery note</label>
                <textarea class="form-control" id="w-note" name="deliveryNote" rows="3" placeholder="What did you change? What should the reviewer focus on?"></textarea>
              </div>
              <button class="btn-outline-soft w-100 mb-3" type="submit"><i class="bi bi-plus-circle me-2"></i> Save to Deliverables</button>
            </form>
            <div class="eyebrow mt-4">Final submission</div>
            <h4 class="mt-3 mb-3">AI pre-check + Send for review</h4>
            <p class="muted mb-3">Before submission, Swapski AI will check that a link or file exists and that checklist progress looks reasonable. If ok the task moves to Review.</p>
            <button class="btn-gradient w-100" data-action="workspace-submit-task" data-request-id="${request.id}">
              <i class="bi bi-send-check me-2"></i> Run AI check & Submit Task
            </button>
          </div>
          <div class="glass-card-soft p-4">
            <div class="eyebrow">Workflow step</div>
            <h4 class="mt-3 mb-3">Move task forward</h4>
            <div class="content-stack gap-2">
              ${request.status === "accepted" ? `
                <button class="btn-gradient w-100" data-action="request-status" data-request-id="${request.id}" data-next-status="in_progress"><i class="bi bi-play-circle me-2"></i> Start work (move to In Progress)</button>
              ` : ""}
              ${request.status === "in_progress" ? `
                <span class="badge-soft">In progress · Submit deliverables above</span>
              ` : ""}
              ${request.status === "review" ? `
                <span class="badge-soft">In review · Waiting for ${ctx.references.length ? "requester" : "partner"}</span>
              ` : ""}
              ${request.status === "completed" ? `
                <span class="badge-soft">Completed</span>
              ` : ""}
            </div>
          </div>
        </div>
      ` : `
        <div class="content-stack">
          <div class="glass-card-soft p-4">
            <div class="eyebrow">Review latest delivery</div>
            <h3 class="mt-3 mb-3">Approve or request changes</h3>
            ${request.status === "review" ? `
              <div class="content-stack gap-2">
                <button class="btn-gradient w-100" data-action="approve-request" data-request-id="${request.id}"><i class="bi bi-check2-circle me-2"></i> Approve & release credits</button>
                <button class="btn-outline-soft w-100" data-action="request-revision" data-request-id="${request.id}"><i class="bi bi-arrow-repeat me-2"></i> Request revisions</button>
              </div>
            ` : `<span class="badge-soft">${prettyStatus(request.status)} — no review action needed</span>`}
          </div>
        </div>
      `}
    </div>
  `;
}

function renderWorkspaceActivity(ctx) {
  const { request, ledgerLines, isProvider, partner } = ctx;
  const requestMessages = state.messages.filter((m) => m.requestId === request.id);
  const events = [];
  events.push({
    at: request.createdAt,
    kind: "Request created",
    body: `${isProvider ? (partner?.name || "Partner") : "You"} published the service.`,
    icon: "bi-bag-plus",
  });
  ledgerLines.forEach((l) => {
    const user = getUser(l.userId);
    events.push({
      at: l.createdAt,
      kind: `Ledger · ${l.type}`,
      body: `${user?.name || "User"} ${l.direction} ${formatCredits(l.amount)} — ${l.description}`,
      icon: l.type === "lock" ? "bi-shield-lock" : l.type === "earn" ? "bi-lightning-charge" : "bi-arrow-left-right",
    });
  });
  requestMessages.forEach((m) => {
    if (m.senderId === "system") {
      events.push({ at: m.createdAt, kind: "System", body: m.body, icon: "bi-info-circle" });
    } else {
      const sender = getUser(m.senderId);
      events.push({ at: m.createdAt, kind: `Chat · ${sender?.name || "User"}`, body: (m.body || "").slice(0, 140), icon: "bi-chat-dots" });
    }
  });
  (request.deliveries || []).forEach((d) => {
    const sender = getUser(d.by);
    events.push({
      at: d.at,
      kind: d.isReference ? "Reference shared" : "Delivery added",
      body: `${sender?.name || "User"} added ${d.link ? "link" : ""}${d.link && d.fileName ? " + " : ""}${d.fileName || ""}${d.note ? ` · "${d.note.slice(0,60)}"` : ""}`,
      icon: d.isReference ? "bi-paperclip" : "bi-folder2-open",
    });
  });
  events.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
  return `
    <div class="glass-card-soft p-4">
      <div class="eyebrow">Activity log</div>
      <h3 class="mt-3 mb-3">Everything that happened for this swap</h3>
      <div class="timeline-list">
        ${events.slice().reverse().map((e) => `
          <div class="timeline-item">
            <div class="timeline-dot"><i class="bi ${e.icon}"></i></div>
            <div>
              <div class="d-flex align-items-center gap-2 flex-wrap">
                <strong>${e.kind}</strong>
                <span class="x-small muted">${formatDateTime(e.at)}</span>
              </div>
              <div class="muted mt-1">${e.body}</div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderWorkspaceEscrow(ctx) {
  const { request, service, isProvider, walletOfUser, escrowEntry, releaseEntry, earnEntry, ledgerLines } = ctx;
  return `
    <div class="workspace-grid">
      <div class="content-stack">
        <div class="glass-card-soft p-4 escrow-hero">
          <div class="card-header-row">
            <div>
              <div class="eyebrow">Escrow for ${service?.title || "project"}</div>
              <h2 class="mt-3 mb-1">${formatCredits(request.creditAmount)} <span class="badge-soft ms-2">Demo Simulation · No Real Funds</span></h2>
              <div class="muted">${isProvider ? "You will earn these credits once the requester approves." : "Your credits locked here until you approve delivery."}</div>
            </div>
            <span class="status-chip ${request.status}">${prettyStatus(request.status)}</span>
          </div>
          <div class="row g-4 mt-4 text-center">
            <div class="col-md-4">
              <div class="kpi-label muted">Locked</div>
              <div class="kpi-value mt-2">${escrowEntry ? formatCredits(escrowEntry.amount) : formatCredits(0)}</div>
              <div class="badge-soft mt-2">${escrowEntry?.status || "pending"}</div>
            </div>
            <div class="col-md-4">
              <div class="kpi-label muted">Released</div>
              <div class="kpi-value mt-2">${releaseEntry ? formatCredits(releaseEntry.amount) : formatCredits(0)}</div>
              <div class="badge-soft mt-2">${releaseEntry ? "sent to provider" : "pending"}</div>
            </div>
            <div class="col-md-4">
              <div class="kpi-label muted">Earned by Provider</div>
              <div class="kpi-value mt-2">${earnEntry ? formatCredits(earnEntry.amount) : formatCredits(0)}</div>
              <div class="badge-soft mt-2">${earnEntry ? "credited" : "pending"}</div>
            </div>
          </div>
        </div>
        <div class="glass-card-soft p-4">
          <div class="eyebrow">Immutable ledger</div>
          <h4 class="mt-3 mb-3">All credit movements</h4>
          ${ledgerLines.length ? `
            <div class="content-stack gap-3">
              ${ledgerLines.map((l) => {
                const user = getUser(l.userId);
                const dir = l.direction === "in" ? "bi-arrow-down-left text-success" : l.direction === "out" ? "bi-arrow-up-right text-danger" : "bi-pause text-warning";
                return `
                  <div class="ledger-row">
                    <div class="ledger-icon ${l.type}"><i class="bi ${dir}"></i></div>
                    <div class="flex-grow-1">
                      <div class="d-flex gap-2 align-items-center flex-wrap">
                        <strong>${l.type}</strong>
                        <span class="badge-soft">${l.status}</span>
                        <span class="x-small muted ms-auto">${formatDateTime(l.createdAt)}</span>
                      </div>
                      <div class="muted small mt-1">${user?.name || "User"} · ${l.description}</div>
                    </div>
                    <div class="fw-semibold">${formatCredits(l.amount)}</div>
                  </div>
                `;
              }).join("")}
            </div>
          ` : `<div class="muted p-3">No ledger entries yet.</div>`}
        </div>
      </div>
      <div class="glass-card-soft p-4">
        <div class="eyebrow">${isProvider ? "Provider" : "Requester"} wallet snapshot</div>
        <h4 class="mt-3 mb-3">Balances derived from all transactions</h4>
        <div class="wallet-bars mb-4">
          ${walletBar("Available", walletOfUser.available, Math.max(walletOfUser.available, 1), "100%")}
          ${walletBar("Escrowed", walletOfUser.escrow, Math.max(walletOfUser.available + walletOfUser.escrow, 1), `${Math.min(100, Math.round((walletOfUser.escrow / Math.max(walletOfUser.available + walletOfUser.escrow, 1)) * 100))}%`)}
          ${walletBar("Lifetime earned", walletOfUser.earned, Math.max(walletOfUser.earned, 1), "100%")}
          ${walletBar("Lifetime spent", walletOfUser.spent, Math.max(walletOfUser.spent, 1), "100%")}
        </div>
        <div class="d-flex gap-2 flex-wrap">
          <button class="btn-outline-soft w-100" data-action="close-workspace">Back to workspace</button>
          ${isProvider ? `<button class="btn-gradient w-100" data-action="switch-workspace-tab" data-tab="deliverables" data-request-id="${request.id}">Submit deliverables</button>` : request.status === "review" ? `<button class="btn-gradient w-100" data-action="approve-request" data-request-id="${request.id}">Approve & release</button>` : ""}
        </div>
      </div>
    </div>
  `;
}

function aiAnswer(question, { request, service, brief }) {
  const q = (question || "").toLowerCase().trim();
  const provider = getUser(request.providerId)?.name || "Provider";
  const requester = getUser(request.requesterId)?.name || "Requester";
  const refs = brief.refs || [];
  const attachments = brief.attachments || [];
  if (!q) return "I didn't catch that. Try: 'Summarize the project goals in 3 bullets' or 'What files do I need to deliver?'";
  if (/goal|bullet|summary|sum|what.*this.*project|scope/.test(q)) {
    return `Project goals for "${service?.title || "the project"}":
1. ${brief.goals ? brief.goals[0] : "Deliver high-quality work within the agreed scope"}
2. ${brief.goals ? brief.goals[1] : "Match the brief's art direction and requirements"}
3. ${brief.goals ? brief.goals[2] : "Be ready for handoff on time, with any source files"}

Key scope: ${(brief.scope || "Cover the requirements listed in the service.").split("\n").slice(0, 2).join(" • ")}`;
  }
  if (/deliver|file|attachment|what.*upload|output|artifacts/.test(q)) {
    return `Expected deliverables for ${service?.category || "this project"}:
• At least one shareable link (Figma / Notion / GitHub / Google Drive / Loom / Vercel preview etc.)
• Attached source files (ZIP, PDF, MP4, Figma export…) where applicable
• Short delivery note explaining what you changed and what the reviewer should focus on
• A quick line in the Chat if anything needs clarification

Currently you have ${attachments.length} reference asset${attachments.length === 1 ? "" : "s"} shared by the requester. Add your own work by clicking the Deliverables tab → Upload deliverable.`;
  }
  if (/deadline|track|on track|timeline|due|milestone/.test(q)) {
    const due = formatDateTime(request.dueAt);
    return `Deadline snapshot:
• Due date: ${due}
• Status: ${prettyStatus(request.status)}
• Milestones:
${(brief.milestones || []).map((m, i) => `  ${i + 1}. ${m}`).join("\n") || "  1. Agree scope\n  2. Draft\n  3. Final delivery & review"}

If you have at least 1 delivery uploaded and more than a day of runway, you're likely on track — but use the Chat tab early if scope is unclear!`;
  }
  if (/checklist|submission|submit|preflight|final/.test(q)) {
    return `Pre-submission checklist I'll verify when you hit "Submit Task":
✅ At least 1 link or file attached to Deliverables
✅ At least 3/5 checklist items complete
✅ Task status is In Progress or Accepted (auto-advanced if needed)

If any item fails, I'll tell you exactly what to add and keep the task in In Progress. Once passed, the task moves to Review and the partner is notified.`;
  }
  if (/name|naming|convention|folder|structure/.test(q)) {
    return `Naming suggestions for consistency:
• Links: paste the full shareable URL with permissions set correctly (anyone with link can view)
• Files: swapski_${(service?.category || "project").toLowerCase()}_draft01_v01.zip — prefix_service_version
• Notes: one line summary of what changed + one line describing what to review

Keep attachments per delivery under 5 MB in this prototype; large zips should be shared via a link.`;
  }
  if (/reference|ref|source|asset|brand/.test(q)) {
    return `Reference materials provided by ${requester}:
Links:
${refs.map((r) => `• ${r}`).join("\n")}
Attachments:
${attachments.map((a) => `• ${a.fileName}${a.fileSize ? ` (${formatBytes(a.fileSize)})` : ""}${a.fileType ? ` · ${a.fileType}` : ""}`).join("\n") || "• (none yet)"}

Access them any time from the Deliverables tab → References section.`;
  }
  return `Swapski AI on "${service?.title || "the project"}":
• ${service?.description || "See Overview tab for full brief."}
• Budget locked in escrow: ${formatCredits(request.creditAmount)}
• People: ${requester} (requester) · ${provider} (provider)

Ask me about: goals, deliverables, deadline/timeline, submission checklists, naming conventions, or the reference files.`;
}

function skillChip(label, opts = {}) {
  const { active = false, icon = null } = opts;
  return `<span class="skill-chip ${active ? "active" : ""}">${icon ? `<i class="bi ${icon} me-1"></i>` : ""}${label}</span>`;
}

function badgeSoft(iconClass, label) {
  return `<span class="badge-soft"><i class="bi ${iconClass} me-1"></i>${label}</span>`;
}

function serviceCard(service) {
  const owner = getUser ? getUser(service.userId) : state.users.find((u) => u.id === service.userId);
  const ownerName = owner ? owner.name : "Swapski member";
  const ownerRating = owner && owner.rating ? owner.rating.toFixed(1) : "4.8";
  const img = service.image || "";
  const me = getCurrentUser();
  const selfOwned = me && me.id === service.userId;
  const favs = Array.isArray(state.favorites) ? state.favorites : [];
  const isSaved = favs.some((f) => f.userId === me.id && f.serviceId === service.id);
  return `
    <article class="glass-card fade-in overflow-hidden p-0">
      ${img ? `<div class="service-art"><img src="${img}" alt="${service.title || "Service preview"}" /></div>` : ""}
      <div class="p-5">
        <div class="d-flex align-items-center justify-content-between gap-3">
          <div class="eyebrow">${ownerName} · <i class="bi bi-star-fill text-warning me-1"></i>${ownerRating}</div>
          ${service.featured ? `<span class="badge badge-pill badge-soft"><i class="bi bi-lightning-charge-fill text-cyan me-1"></i>Featured</span>` : ""}
        </div>
        <h3 class="h5 mt-3">${service.title || "Untitled service"}</h3>
        <p class="muted mt-2">${truncate(service.description, 120)}</p>
        <div class="d-flex flex-wrap gap-2 mt-4">
          ${(service.tags || []).slice(0, 3).map((t) => `<span class="category-chip"><i class="bi bi-tag me-1"></i>${t}</span>`).join("")}
        </div>
        <div class="hero-metrics mt-4">
          ${metricCard(formatCredits(service.creditCost), "Starting")}
          ${metricCard(service.deliveryTime || "Flexible", "Delivery")}
          ${metricCard(`${service.revisions ?? 2} revisions`, "Included")}
        </div>
        <div class="hero-actions mt-4 mb-0">
          <button class="btn-ghost round-icon ${isSaved ? "saved" : ""}" data-action="${isSaved ? "unsave-service" : "save-service"}" data-service-id="${service.id}" aria-label="${isSaved ? "Unsave service" : "Save service"}">
            <i class="bi bi-bookmark${isSaved ? "-check-fill text-cyan" : ""}"></i>
          </button>
          <button class="btn-outline-soft" data-action="open-service-modal" data-service-id="${service.id}">
            <i class="bi bi-eye pe-1"></i> Details
          </button>
          <button class="btn-gradient" data-action="${selfOwned ? "open-service-modal" : "accept-offer"}" data-service-id="${service.id}" ${selfOwned ? "disabled" : ""}>
            <i class="bi bi-check-circle pe-1"></i> ${selfOwned ? "Your service" : "Accept"}
          </button>
        </div>
      </div>
    </article>`;
}

function makeId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function isAIUser(userId) {
  return !!AI_PERSONAE[userId];
}

function generateTaskBrief(service, requesterId, providerName) {
  const categoryKey = TASK_BRIEFS[service.category] ? service.category : "Design";
  const spec = TASK_BRIEFS[categoryKey];
  const persona = AI_PERSONAE[requesterId] || { name: "Partner", signoff: "" };
  const header = `Hey ${providerName.split(" ")[0]}! Thanks so much for picking this up — super excited to work with you. Here's the full brief so you can run with it. If anything is unclear just ping me here, I usually reply within the hour.\n\n<strong>📋 Project Scope</strong>\n${spec.scope}\n\n<strong>🎯 Success Goals</strong>\n${spec.goals.map((g, i) => `${i + 1}. ${g}`).join("\n")}\n\n<strong>🗓 Milestones</strong>\n${spec.milestones.map((m, i) => `${i + 1}. ${m}`).join("\n")}\n\n<strong>🔗 Reference Links</strong>\n${spec.refs.map((r) => `• ${r}`).join("\n")}\n\nLet me know which milestone you want to lock first! And feel free to push back if anything here doesn't make sense — I'd much rather align up front than rework later.\n\n${persona.signoff}`;
  return {
    body: header,
    refs: spec.refs,
    attachments: spec.attachments,
  };
}

function scheduleAIRequesterBrief(requestId, delay = 1800) {
  if (!requestId) return;
  setTimeout(() => {
    const request = state.requests.find((r) => r.id === requestId);
    if (!request) return;
    const service = state.services.find((s) => s.id === request.serviceId);
    const requester = getUser(request.requesterId);
    const provider = getUser(request.providerId);
    if (!service || !requester || !provider) return;
    if (!isAIUser(request.requesterId)) return;

    const brief = generateTaskBrief(service, request.requesterId, provider.name);
    const now = new Date().toISOString();
    setState((draft) => {
      const req = draft.requests.find((r) => r.id === requestId);
      if (!req.deliveries) req.deliveries = [];
      brief.attachments.forEach((att) => {
        req.deliveries.push({
          id: makeId("ref"),
          requestId,
          by: request.requesterId,
          at: now,
          link: null,
          note: `Reference asset provided by ${requester.name}`,
          fileName: att.fileName,
          fileSize: att.fileSize,
          fileType: att.fileType,
          isReference: true,
        });
      });

      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: request.requesterId,
        body: brief.body,
        createdAt: now,
      });

      const linkList = brief.refs.map((r) => `<a href="${r}" target="_blank" rel="noopener" style="color: var(--accent); text-decoration: underline;">${r}</a>`).join(" • ");
      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: "system",
        body: `${requester.name} shared ${brief.attachments.length} reference file(s) and ${brief.refs.length} link(s): ${linkList}`,
        createdAt: now,
      });

      draft.notifications.unshift({
        id: makeId("note"),
        userId: request.providerId,
        title: `${requester.name} shared project details`,
        body: `Brief, reference links, and assets for "${service.title}" are ready in the chat. Review and start work when ready!`,
        type: "swap",
        createdAt: now,
        readAt: null,
        route: "messages",
        routeId: null,
      });
    });
    showToast("Task details received", `${requester.name} shared a full brief with reference links and attachments.`, "success");
  }, delay);
}

function scheduleAIReview(requestId, delay = 3200) {
  if (!requestId) return;
  // #region debug-point H3:schedule-ai-entry
  fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "H3", location: "app.js:scheduleAIReview:entry", msg: "[DEBUG] scheduleAIReview called", data: { requestId, delay, ts: Date.now() }, ts: Date.now() }) }).catch(() => {});
  // #endregion
  setTimeout(() => {
    const request = state.requests.find((r) => r.id === requestId);
    if (!request) return;
    // #region debug-point H3:schedule-ai-timeout-fired
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "H3", location: "app.js:scheduleAIReview:timeout-body", msg: "[DEBUG] scheduleAIReview setTimeout fired", data: { requestId, requestStatus: request.status, isAIRequester: isAIUser(request.requesterId), requesterId: request.requesterId, deliveriesCount: (request.deliveries || []).length, ts: Date.now() }, ts: Date.now() }) }).catch(() => {});
    // #endregion
    if (!isAIUser(request.requesterId)) return;
    const requester = getUser(request.requesterId);
    const provider = getUser(request.providerId);
    if (!requester || !provider) return;

    const revisionCount = (request.deliveries || []).filter((d) => !d.isReference).length;
    const shouldRequestRevision = revisionCount === 1 && Math.random() < 0.2;
    // #region debug-point H3:schedule-ai-decision
    fetch("http://127.0.0.1:7777/event", { method: "POST", body: JSON.stringify({ sessionId: "workspace-workflow-broken", runId: "pre", hypothesisId: "H3", location: "app.js:scheduleAIReview:decision", msg: "[DEBUG] scheduleAIReview decision: approve or request revision", data: { requestId, revisionCount, shouldRequestRevision, requesterName: requester?.name, providerName: provider?.name }, ts: Date.now() }) }).catch(() => {});
    // #endregion

    if (shouldRequestRevision) {
      const persona = AI_PERSONAE[request.requesterId] || {};
      const revisionMsg = [
        `Hey ${provider.name.split(" ")[0]}! Love the direction overall. One small pass before I approve — can you:\n• Lighten the hero background gradient by ~20%\n• Bump the CTA button font size by 2px\n• Add a small "Trusted by" logo row below the fold metrics\n\n${persona.signoff || ""}`,
        `This is really close! Two quick tweaks I'd love before sign-off:\n1. Swap the order of the two middle sections\n2. Make pricing tier-2 badge more prominent\n3. Fix the last 2 FAQ accordion answers that got cut off\n\n${persona.signoff || ""}`,
      ][Math.floor(Math.random() * 2)];

      setState((draft) => {
        const req = draft.requests.find((r) => r.id === requestId);
        req.status = "in_progress";
        const now = new Date().toISOString();
        draft.messages.push({
          id: makeId("msg"),
          requestId,
          senderId: request.requesterId,
          body: revisionMsg,
          createdAt: now,
        });
        draft.messages.push({
          id: makeId("msg"),
          requestId,
          senderId: "system",
          body: "Revision requested. Once updated, submit delivery again to send for re-review.",
          createdAt: now,
        });
        draft.notifications.unshift({
          id: makeId("note"),
          userId: request.providerId,
          title: `${requester.name} requested revisions`,
          body: "Small tweaks requested — update your delivery and re-submit.",
          type: "swap",
          createdAt: now,
          readAt: null,
          route: "messages",
          routeId: null,
        });
      });
      showToast("Revision requested", `${requester.name} shared small changes — update and re-submit delivery.`, "warning");
      return;
    }

    approveRequest(requestId);
    setState((draft) => {
      const existing = draft.reviews.find(
        (r) => r.authorId === request.requesterId && r.subjectId === request.providerId && r.requestId === requestId
      );
      if (!existing) {
        const reviewText = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
        draft.reviews.unshift({
          id: makeId("rev"),
          requestId,
          authorId: request.requesterId,
          subjectId: request.providerId,
          score: 5,
          review: reviewText,
        });
      }
    });
    openTaskCompleted(requestId);
    showToast("Delivery approved ✨", `${requester.name} released ${formatCredits(request.creditAmount)} and left a 5-star review!`, "success");
  }, delay);
}

function scheduleAIProviderWorkflow(requestId) {
  if (!requestId) return;
  setTimeout(() => {
    const request = state.requests.find((r) => r.id === requestId);
    if (!request || request.status !== "requested") return;
    const service = state.services.find((s) => s.id === request.serviceId);
    const requester = getUser(request.requesterId);
    const provider = getUser(request.providerId);
    if (!service || !requester || !provider) return;
    if (!isAIUser(request.providerId)) return;

    const persona = AI_PERSONAE[request.providerId] || { signoff: "Thanks!" };
    const categoryKey = TASK_BRIEFS[service.category] ? service.category : "Design";
    const spec = TASK_BRIEFS[categoryKey];
    const now = new Date().toISOString();

    setState((draft) => {
      const req = draft.requests.find((r) => r.id === requestId);
      req.status = "accepted";
      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: request.providerId,
        createdAt: now,
        body: `Hey ${requester.name.split(" ")[0]}! 🎉 Thanks so much for booking my ${service.title} service. I'm excited to work on this with you.\n\nI'll start by reviewing the scope and aligning on success metrics. Quick questions to kick us off:\n1. Do you have any existing brand assets (logos, color palettes, typography) I should use?\n2. What's the #1 most important thing this project should accomplish for you?\n3. Is there a hard deadline I should know about?\n\nI'll start a first draft while you reply — usually takes me a couple of hours for the initial pass.\n\n${persona.signoff}`,
      });
      draft.messages.push({
        id: makeId("msg"),
        requestId,
        senderId: "system",
        createdAt: now,
        body: `${provider.name} accepted your booking. They'll begin work shortly and share a draft within the next few hours.`,
      });
      draft.notifications.unshift({
        id: makeId("note"),
        userId: request.requesterId,
        title: `${provider.name} accepted your booking!`,
        body: "They sent a kickoff message in the chat and are starting work.",
        type: "swap",
        createdAt: now,
        readAt: null,
        route: "messages",
      });
    });
    showToast("Booking accepted", `${provider.name} confirmed your ${service.title} booking and is starting work.`, "success");

    setTimeout(() => {
      const request2 = state.requests.find((r) => r.id === requestId);
      if (!request2) return;
      const now2 = new Date().toISOString();
      const sampleLink = spec.refs[0] || "https://www.figma.com/community/file/swapski-demo-output";
      setState((draft) => {
        const req2 = draft.requests.find((r) => r.id === requestId);
        req2.status = "in_progress";
        if (!req2.deliveries) req2.deliveries = [];
        req2.deliveries.push({
          id: makeId("del"),
          requestId,
          by: request2.providerId,
          at: now2,
          link: sampleLink,
          note: `First draft ready! This covers the core ${categoryKey} deliverables:\n\n• ${spec.goals[0] || "Main structure"}\n• ${spec.goals[1] || "Responsive layout"}\n• ${spec.goals[2] || "Copy + CTAs"}\n\nLet me know what you'd like to tweak — I'm happy to iterate!`,
          fileName: null,
          fileSize: null,
          fileType: null,
          isReference: false,
        });
        draft.messages.push({
          id: makeId("msg"),
          requestId,
          senderId: request2.providerId,
          createdAt: now2,
          body: `First draft is ready! 🚀 I've uploaded the work to Deliverables — the link is also in this chat:\n${sampleLink}\n\nTake a look when you have a minute and let me know:\n1. What's working well for you\n2. Anything you'd like changed\n3. If we need to add any references I missed\n\nHappy to do ${service.revisions ?? 2} rounds of revisions, no rush.`,
        });
        req2.status = "review";
      });
      showToast("Delivery received", `${provider.name} shared a first draft and moved it to review.`, "success");
    }, 4200);
  }, 1800);
  setTimeout(() => {
    const requestFinal = state.requests.find((r) => r.id === requestId);
    if (!requestFinal || requestFinal.status !== "review") return;
    if (!isAIUser(requestFinal.requesterId)) {
      approveRequest(requestId);
      setState((draft) => {
        const existing = draft.reviews.find(
          (r) => r.authorId === requestFinal.requesterId && r.subjectId === requestFinal.providerId && r.requestId === requestId
        );
        if (!existing) {
          const reviewText = REVIEW_TEMPLATES[Math.floor(Math.random() * REVIEW_TEMPLATES.length)];
          draft.reviews.unshift({
            id: makeId("rev"),
            requestId,
            authorId: requestFinal.requesterId,
            subjectId: requestFinal.providerId,
            score: 5,
            review: reviewText,
          });
        }
      });
    }
  }, 8000);
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
