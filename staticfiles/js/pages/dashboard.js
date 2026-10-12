// static/js/pages/dashboard.js - Authenticated Dashboard page

async function renderDashboard() {
  const container = document.getElementById("app-main-content");
  if (!container) return;

  container.innerHTML = `
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 class="fw-bold mb-1">Welcome, ${esc(window.currentUser?.full_name || window.currentUser?.handle || "Member")}</h2>
          <p class="text-secondary small mb-0">Here is your skill swap overview and pending actions.</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-outline-cyan btn-sm" id="btn-dashboard-publish">
            <i class="bi bi-plus-circle me-1"></i>Publish Service
          </button>
          <a href="#/marketplace" class="btn btn-primary btn-sm">
            <i class="bi bi-search me-1"></i>Find Services
          </a>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div id="dashboard-loading" class="text-center py-5">
        <div class="spinner-border text-cyan" role="status"></div>
        <p class="text-secondary small mt-2">Loading dashboard...</p>
      </div>

      <div id="dashboard-content" class="d-none">
        <!-- Balances Grid -->
        <div class="row g-3 mb-4">
          <div class="col-6 col-md-3">
            <div class="glass-panel p-3 h-100">
              <div class="text-secondary small mb-1">Available Credits</div>
              <div class="fs-3 fw-bold text-cyan" id="dash-bal-available">0</div>
              <div class="small text-secondary mt-1">Ready to spend</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="glass-panel p-3 h-100">
              <div class="text-secondary small mb-1">Held in Escrow</div>
              <div class="fs-3 fw-bold text-warning" id="dash-bal-escrow">0</div>
              <div class="small text-secondary mt-1">Active requests</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="glass-panel p-3 h-100">
              <div class="text-secondary small mb-1">Total Earned</div>
              <div class="fs-3 fw-bold text-success" id="dash-bal-earned">0</div>
              <div class="small text-secondary mt-1">From deliveries</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="glass-panel p-3 h-100">
              <div class="text-secondary small mb-1">Total Spent</div>
              <div class="fs-3 fw-bold text-light" id="dash-bal-spent">0</div>
              <div class="small text-secondary mt-1">On hired services</div>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <!-- Needs Your Action -->
          <div class="col-lg-7">
            <div class="glass-panel p-4 h-100">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Needs Your Action</h5>
                <span class="badge bg-primary-subtle text-cyan" id="dash-action-badge">0 pending</span>
              </div>
              <div id="dash-action-list" class="d-flex flex-column gap-2">
                <!-- Action items -->
              </div>
            </div>
          </div>

          <!-- Recent Notifications -->
          <div class="col-lg-5">
            <div class="glass-panel p-4 h-100">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Recent Notifications</h5>
                <a href="#/notifications" class="small text-cyan text-decoration-none">View All</a>
              </div>
              <div id="dash-notifications-list" class="d-flex flex-column gap-2">
                <!-- Notifications -->
              </div>
            </div>
          </div>
        </div>

        <!-- Recommended Services -->
        <div class="mb-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 class="fw-bold mb-0">Recommended for You</h5>
              <p class="text-secondary small mb-0">Active services aligned with your skills and interests</p>
            </div>
            <a href="#/marketplace" class="small text-cyan text-decoration-none">Explore All &rarr;</a>
          </div>
          <div id="dash-recommended-grid" class="row g-3">
            <!-- Recommended services -->
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-dashboard-publish")?.addEventListener("click", () => {
    if (typeof openCreateServiceModal === "function") {
      openCreateServiceModal();
    } else {
      window.location.hash = "#/marketplace";
    }
  });

  try {
    const data = await api.get("dashboard/");
    const loading = document.getElementById("dashboard-loading");
    const content = document.getElementById("dashboard-content");
    if (!loading || !content) return;

    loading.classList.add("d-none");
    content.classList.remove("d-none");

    // Balances
    document.getElementById("dash-bal-available").textContent = data.balances.available;
    document.getElementById("dash-bal-escrow").textContent = data.balances.escrow;
    document.getElementById("dash-bal-earned").textContent = data.balances.earned;
    document.getElementById("dash-bal-spent").textContent = data.balances.spent;

    // Needs action
    const actionList = document.getElementById("dash-action-list");
    const actionBadge = document.getElementById("dash-action-badge");
    const actions = data.needs_action || [];
    actionBadge.textContent = `${actions.length} pending`;

    if (actions.length === 0) {
      actionList.innerHTML = `
        <div class="text-center py-4 text-secondary small">
          <i class="bi bi-check-circle fs-3 text-success d-block mb-2"></i>
          All caught up! No urgent swap requests or deliveries waiting.
        </div>
      `;
    } else {
      actionList.innerHTML = actions.map((item) => {
        const isIncoming = item.type === "incoming_request";
        return `
          <div class="action-item-card p-3 rounded d-flex justify-content-between align-items-center"
               style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge ${isIncoming ? "bg-warning-subtle text-warning" : "bg-cyan-subtle text-cyan"}">
                  ${isIncoming ? "New Request" : "Delivery for Review"}
                </span>
                <span class="small text-secondary">${formatRelativeTime(item.created_at)}</span>
              </div>
              <div class="fw-semibold text-light">${esc(item.title)}</div>
              <div class="small text-secondary">With ${esc(item.partner_name)} · <span class="text-cyan">${esc(item.credits)} cr</span></div>
            </div>
            <a href="#/swaps/${item.swap_id}" class="btn btn-sm ${isIncoming ? "btn-warning" : "btn-primary"}">
              ${isIncoming ? "Respond" : "Review"}
            </a>
          </div>
        `;
      }).join("");
    }

    // Notifications
    const notifList = document.getElementById("dash-notifications-list");
    const notifs = data.recent_notifications || [];
    if (notifs.length === 0) {
      notifList.innerHTML = `<div class="text-secondary small py-3 text-center">No notifications yet.</div>`;
    } else {
      notifList.innerHTML = notifs.map((n) => `
        <a href="#/${n.link || "notifications"}" class="text-decoration-none p-2 rounded d-flex align-items-start gap-2 hover-bg"
           style="background: rgba(255,255,255,0.02);">
          <i class="bi bi-bell-fill text-cyan mt-1"></i>
          <div class="flex-grow-1">
            <div class="small fw-semibold text-light">${esc(n.title)}</div>
            <div class="text-secondary" style="font-size: 0.75rem;">${esc(n.body)}</div>
          </div>
          <span class="text-secondary" style="font-size: 0.7rem;">${formatRelativeTime(n.created_at)}</span>
        </a>
      `).join("");
    }

    // Recommended
    const recGrid = document.getElementById("dash-recommended-grid");
    const recs = data.recommended_services || [];
    if (recs.length === 0) {
      recGrid.innerHTML = `<div class="col-12 text-secondary small py-3">No recommended services found. Browse the marketplace to find skills!</div>`;
    } else {
      recGrid.innerHTML = recs.map((svc) => {
        const meta = getCategoryMeta(svc.category);
        return `
          <div class="col-md-4">
            <div class="glass-panel p-3 h-100 d-flex flex-column">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-dark-subtle text-light border border-secondary-subtle small">${esc(svc.category)}</span>
                <span class="text-cyan fw-bold">${esc(svc.credit_cost)} <small class="text-secondary">cr</small></span>
              </div>
              <h6 class="fw-bold text-light mb-1">${esc(svc.title)}</h6>
              <p class="text-secondary small flex-grow-1 mb-2">${esc(svc.description.slice(0, 80))}${svc.description.length > 80 ? "..." : ""}</p>
              <div class="d-flex justify-content-between align-items-center pt-2 border-top border-dark-subtle">
                <a href="#/users/${svc.owner.id}" class="text-decoration-none small text-secondary">
                  by ${esc(svc.owner.full_name || svc.owner.handle)}
                </a>
                <a href="#/marketplace" class="btn btn-sm btn-outline-cyan">Details</a>
              </div>
            </div>
          </div>
        `;
      }).join("");
    }
  } catch (err) {
    console.error("Dashboard error", err);
    showToast(err.detail || "Failed to load dashboard data.", "error");
  }
}

window.renderDashboard = renderDashboard;
