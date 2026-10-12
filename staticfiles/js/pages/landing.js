// static/js/pages/landing.js - Public landing page

async function renderLanding() {
  const container = document.getElementById("app");
  container.innerHTML = `
    <div class="landing-page">
      <!-- Public Nav -->
      <header class="public-nav">
        <div class="container d-flex justify-content-between align-items-center py-3">
          <a href="#/landing" class="brand-logo d-flex align-items-center gap-2 text-decoration-none">
            <img src="/static/img/SWAP.png" alt="Swapski" class="brand-mark" style="height: 32px;" />
            <span class="brand-name fw-bold fs-4">Swapski</span>
          </a>
          <div class="d-flex align-items-center gap-3">
            <a href="#/marketplace" class="btn btn-link text-decoration-none text-light-emphasis">Marketplace</a>
            <a href="#/signin" class="btn btn-outline-light btn-sm px-3">Sign In</a>
            <a href="#/signup" class="btn btn-primary btn-sm px-3">Join & Get 300 Credits</a>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="landing-hero py-5 text-center">
        <div class="container py-4">
          <div class="badge-pill mb-3">
            <i class="bi bi-shield-check text-cyan"></i>
            <span>Virtual Credits · Safe Escrow Workflow</span>
          </div>
          <h1 class="hero-title display-4 fw-black mb-3">
            Exchange Skills. <span class="gradient-text">Not Money.</span>
          </h1>
          <p class="hero-subtitle lead text-secondary mx-auto mb-4" style="max-width: 650px;">
            Swapski is a collaborative skill-swapping platform where builders and creators hire each other using Swap Credits. Every new member receives 300 credits on signup.
          </p>
          <div class="d-flex justify-content-center gap-3 mb-5">
            <a href="#/signup" class="btn btn-primary btn-lg px-4">
              <i class="bi bi-lightning-charge-fill me-2"></i>Get Started Free
            </a>
            <a href="#/marketplace" class="btn btn-glass btn-lg px-4">
              <i class="bi bi-grid me-2"></i>Browse Marketplace
            </a>
          </div>

          <!-- Real Dynamic Stats -->
          <div id="landing-stats" class="row g-3 justify-content-center mx-auto" style="max-width: 800px;">
            <div class="col-4">
              <div class="stat-card glass-panel p-3 text-center">
                <div class="stat-value fs-2 fw-bold text-cyan" id="stat-members">...</div>
                <div class="stat-label small text-secondary">Active Members</div>
              </div>
            </div>
            <div class="col-4">
              <div class="stat-card glass-panel p-3 text-center">
                <div class="stat-value fs-2 fw-bold text-purple" id="stat-services">...</div>
                <div class="stat-label small text-secondary">Published Services</div>
              </div>
            </div>
            <div class="col-4">
              <div class="stat-card glass-panel p-3 text-center">
                <div class="stat-value fs-2 fw-bold text-green" id="stat-swaps">...</div>
                <div class="stat-label small text-secondary">Swaps Completed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- How it Works -->
      <section class="py-5 border-top border-dark-subtle">
        <div class="container">
          <div class="text-center mb-5">
            <h2 class="fw-bold">How Swapski Works</h2>
            <p class="text-secondary">Simple, fair collaboration backed by a built-in escrow ledger.</p>
          </div>
          <div class="row g-4">
            <div class="col-md-4">
              <div class="step-card glass-panel p-4 h-100">
                <div class="step-num text-cyan fw-bold fs-5 mb-2">01</div>
                <h4 class="fw-bold mb-2">Publish Services & Skills</h4>
                <p class="text-secondary small">
                  List the services you offer (e.g. UI audit, API integration, research) along with credit cost and delivery turnaround.
                </p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="step-card glass-panel p-4 h-100">
                <div class="step-num text-purple fw-bold fs-5 mb-2">02</div>
                <h4 class="fw-bold mb-2">Hire with Escrow Safety</h4>
                <p class="text-secondary small">
                  Request a service using your virtual credits. Credits are locked safely in escrow until you inspect and approve the delivery.
                </p>
              </div>
            </div>
            <div class="col-md-4">
              <div class="step-card glass-panel p-4 h-100">
                <div class="step-num text-green fw-bold fs-5 mb-2">03</div>
                <h4 class="fw-bold mb-2">Approve, Earn & Review</h4>
                <p class="text-secondary small">
                  Once work is delivered and approved, credits are released to the provider. Both parties leave reviews to build verified reputations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Latest Services Grid -->
      <section class="py-5 border-top border-dark-subtle">
        <div class="container">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 class="fw-bold mb-1">Latest Services</h2>
              <p class="text-secondary small mb-0">Discover skills offered by our community members</p>
            </div>
            <a href="#/marketplace" class="btn btn-outline-light btn-sm">View All Services &rarr;</a>
          </div>
          <div id="landing-services-grid" class="row g-4">
            <div class="col-12 text-center py-4 text-secondary">
              <div class="spinner-border spinner-border-sm text-cyan me-2"></div>Loading services...
            </div>
          </div>
        </div>
      </section>

      <!-- Truthful FAQ -->
      <section class="py-5 border-top border-dark-subtle">
        <div class="container" style="max-width: 800px;">
          <h2 class="fw-bold text-center mb-4">Frequently Asked Questions</h2>
          <div class="accordion accordion-flush" id="landingFaq">
            <div class="accordion-item glass-panel mb-2">
              <h3 class="accordion-header">
                <button class="accordion-button collapsed bg-transparent text-light" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                  What are Swap Credits?
                </button>
              </h3>
              <div id="faq1" class="accordion-collapse collapse" data-bs-parent="#landingFaq">
                <div class="accordion-body text-secondary small">
                  Swap Credits are virtual platform units used to hire services from other members. There is no real-money transactions, credit cards, or cashouts. You start with 300 free credits and earn more by completing services for others.
                </div>
              </div>
            </div>
            <div class="accordion-item glass-panel mb-2">
              <h3 class="accordion-header">
                <button class="accordion-button collapsed bg-transparent text-light" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                  How does Escrow work?
                </button>
              </h3>
              <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#landingFaq">
                <div class="accordion-body text-secondary small">
                  When you request a service, the required credits are locked in escrow from your available balance. The provider delivers the work (via links, notes, or uploaded files). If changes are needed, you can request revisions. Once you approve, credits are released to the provider. If the request is declined or cancelled, your credits are refunded.
                </div>
              </div>
            </div>
            <div class="accordion-item glass-panel mb-2">
              <h3 class="accordion-header">
                <button class="accordion-button collapsed bg-transparent text-light" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                  How can I earn more credits?
                </button>
              </h3>
              <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#landingFaq">
                <div class="accordion-body text-secondary small">
                  Simply publish one or more services from your dashboard. When another member hires you and you deliver the work, the credits are released to your wallet upon approval.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="py-4 border-top border-dark-subtle text-center text-secondary small">
        <div class="container">
          <p class="mb-1">&copy; Swapski · Virtual Skill-Swapping Platform</p>
          <p class="mb-0">Built with Django &amp; Vanilla JavaScript</p>
        </div>
      </footer>
    </div>
  `;

  // Fetch live stats & latest services asynchronously
  try {
    const stats = await api.get("stats/");
    const mEl = document.getElementById("stat-members");
    const sEl = document.getElementById("stat-services");
    const swEl = document.getElementById("stat-swaps");
    if (mEl) mEl.textContent = stats.members;
    if (sEl) sEl.textContent = stats.active_services;
    if (swEl) swEl.textContent = stats.completed_swaps;
  } catch (err) {
    console.error("Stats load failed", err);
  }

  try {
    const svcData = await api.get("services/", { sort: "newest", page: 1 });
    const grid = document.getElementById("landing-services-grid");
    if (!grid) return;

    if (!svcData.results || svcData.results.length === 0) {
      grid.innerHTML = `<div class="col-12 text-center text-secondary py-4">No services available yet. Be the first to publish one!</div>`;
      return;
    }

    grid.innerHTML = svcData.results.slice(0, 6).map((svc) => {
      const meta = getCategoryMeta(svc.category);
      return `
        <div class="col-md-4">
          <div class="service-card glass-panel h-100 d-flex flex-column p-4">
            <div class="service-art-banner mb-3 rounded d-flex align-items-center justify-content-center"
                 style="height: 120px; background: ${meta.gradient}; border: 1px solid rgba(255,255,255,0.08);">
              <i class="bi ${meta.icon} fs-1 text-light opacity-75"></i>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-dark-subtle text-light border border-secondary-subtle">${esc(svc.category)}</span>
              <span class="fw-bold text-cyan">${esc(svc.credit_cost)} <small class="text-secondary">credits</small></span>
            </div>
            <h5 class="fw-bold mb-2">${esc(svc.title)}</h5>
            <p class="text-secondary small flex-grow-1 mb-3">${esc(svc.description.slice(0, 110))}${svc.description.length > 110 ? "..." : ""}</p>
            <div class="d-flex justify-content-between align-items-center pt-2 border-top border-dark-subtle">
              <a href="#/users/${svc.owner.id}" class="text-decoration-none d-flex align-items-center gap-2 text-light">
                <div class="avatar-mini">${getInitials(svc.owner.full_name || svc.owner.handle)}</div>
                <span class="small fw-medium">${esc(svc.owner.full_name || svc.owner.handle)}</span>
              </a>
              <a href="#/marketplace" class="btn btn-sm btn-outline-cyan">View Details</a>
            </div>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    const grid = document.getElementById("landing-services-grid");
    if (grid) grid.innerHTML = `<div class="col-12 text-center text-secondary py-4">Could not load services.</div>`;
  }
}

window.renderLanding = renderLanding;
