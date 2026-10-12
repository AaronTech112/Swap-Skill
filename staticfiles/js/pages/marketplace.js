// static/js/pages/marketplace.js - Marketplace browsing, searching, hiring, and service management

let currentMarketplaceState = {
  q: "",
  category: "All",
  sort: "newest",
  page: 1,
};

let cachedCategories = [];

async function renderMarketplace() {
  const container = document.getElementById("app-main-content") || document.getElementById("app");
  if (!container) return;

  const isPublic = !window.currentUser;

  container.innerHTML = `
    <div class="py-4">
      ${isPublic ? `
        <header class="public-nav mb-4 border-bottom border-dark-subtle pb-3">
          <div class="container d-flex justify-content-between align-items-center">
            <a href="#/landing" class="brand-logo d-flex align-items-center gap-2 text-decoration-none">
              <img src="/static/img/SWAP.png" alt="Swapski" style="height: 32px;" />
              <span class="brand-name fw-bold fs-4 text-light">Swapski</span>
            </a>
            <div class="d-flex align-items-center gap-2">
              <a href="#/signin" class="btn btn-outline-light btn-sm px-3">Sign In</a>
              <a href="#/signup" class="btn btn-primary btn-sm px-3">Join & Get 300 Credits</a>
            </div>
          </div>
        </header>
      ` : ""}

      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h2 class="fw-bold mb-1">Skill Marketplace</h2>
          <p class="text-secondary small mb-0">Browse and request services from skilled community members.</p>
        </div>
        ${!isPublic ? `
          <button class="btn btn-primary" id="btn-create-service">
            <i class="bi bi-plus-lg me-1"></i>Publish a Service
          </button>
        ` : ""}
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="glass-panel p-3 mb-4">
        <div class="row g-2 align-items-center">
          <div class="col-md-6">
            <div class="input-group">
              <span class="input-group-text bg-transparent border-secondary-subtle text-secondary">
                <i class="bi bi-search"></i>
              </span>
              <input type="text" id="marketplace-search-input" class="form-control"
                     placeholder="Search services, skills, or members..." value="${esc(currentMarketplaceState.q)}" />
            </div>
          </div>
          <div class="col-md-3">
            <select id="marketplace-sort-select" class="form-select">
              <option value="newest" ${currentMarketplaceState.sort === "newest" ? "selected" : ""}>Newest First</option>
              <option value="credits_asc" ${currentMarketplaceState.sort === "credits_asc" ? "selected" : ""}>Credits: Low to High</option>
              <option value="credits_desc" ${currentMarketplaceState.sort === "credits_desc" ? "selected" : ""}>Credits: High to Low</option>
            </select>
          </div>
          <div class="col-md-3 text-end">
            <button class="btn btn-outline-secondary w-100" id="marketplace-reset-btn">
              <i class="bi bi-arrow-counterclockwise me-1"></i>Reset Filters
            </button>
          </div>
        </div>

        <!-- Category Pills -->
        <div class="d-flex gap-2 overflow-x-auto pt-3 mt-2 border-top border-dark-subtle" id="marketplace-category-pills">
          <!-- Categories loaded dynamically -->
        </div>
      </div>

      <!-- Results Grid -->
      <div id="marketplace-grid-container" class="row g-4 mb-4">
        <div class="col-12 text-center py-5 text-secondary">
          <div class="spinner-border text-cyan spinner-border-sm me-2"></div>Loading services...
        </div>
      </div>

      <!-- Pagination -->
      <div id="marketplace-pagination" class="d-flex justify-content-between align-items-center py-3 border-top border-dark-subtle d-none">
        <button class="btn btn-outline-secondary btn-sm" id="btn-page-prev">
          <i class="bi bi-chevron-left me-1"></i>Previous
        </button>
        <span class="text-secondary small" id="marketplace-page-info">Page 1 of 1</span>
        <button class="btn btn-outline-secondary btn-sm" id="btn-page-next">
          Next<i class="bi bi-chevron-right ms-1"></i>
        </button>
      </div>
    </div>
  `;

  // Fetch categories if needed
  if (cachedCategories.length === 0) {
    try {
      cachedCategories = await api.get("categories/");
    } catch (e) {
      cachedCategories = [];
    }
  }

  renderCategoryPills();
  setupMarketplaceEvents();
  await loadMarketplaceServices();
}

function renderCategoryPills() {
  const container = document.getElementById("marketplace-category-pills");
  if (!container) return;

  const categories = ["All", ...cachedCategories.map((c) => c.name)];
  container.innerHTML = categories.map((cat) => {
    const active = currentMarketplaceState.category.toLowerCase() === cat.toLowerCase();
    return `
      <button type="button" class="btn btn-sm ${active ? "btn-cyan" : "btn-outline-secondary"} text-nowrap category-filter-btn"
              data-category="${esc(cat)}">
        ${esc(cat)}
      </button>
    `;
  }).join("");

  container.querySelectorAll(".category-filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentMarketplaceState.category = btn.getAttribute("data-category");
      currentMarketplaceState.page = 1;
      renderCategoryPills();
      loadMarketplaceServices();
    });
  });
}

function setupMarketplaceEvents() {
  const searchInput = document.getElementById("marketplace-search-input");
  let debounceTimer;
  searchInput?.addEventListener("input", (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      currentMarketplaceState.q = e.target.value.trim();
      currentMarketplaceState.page = 1;
      loadMarketplaceServices();
    }, 350);
  });

  const sortSelect = document.getElementById("marketplace-sort-select");
  sortSelect?.addEventListener("change", (e) => {
    currentMarketplaceState.sort = e.target.value;
    currentMarketplaceState.page = 1;
    loadMarketplaceServices();
  });

  document.getElementById("marketplace-reset-btn")?.addEventListener("click", () => {
    currentMarketplaceState = { q: "", category: "All", sort: "newest", page: 1 };
    const inp = document.getElementById("marketplace-search-input");
    if (inp) inp.value = "";
    const sel = document.getElementById("marketplace-sort-select");
    if (sel) sel.value = "newest";
    renderCategoryPills();
    loadMarketplaceServices();
  });

  document.getElementById("btn-create-service")?.addEventListener("click", () => {
    openCreateServiceModal();
  });

  document.getElementById("btn-page-prev")?.addEventListener("click", () => {
    if (currentMarketplaceState.page > 1) {
      currentMarketplaceState.page -= 1;
      loadMarketplaceServices();
    }
  });

  document.getElementById("btn-page-next")?.addEventListener("click", () => {
    currentMarketplaceState.page += 1;
    loadMarketplaceServices();
  });
}

async function loadMarketplaceServices() {
  const grid = document.getElementById("marketplace-grid-container");
  const pagination = document.getElementById("marketplace-pagination");
  if (!grid) return;

  try {
    const data = await api.get("services/", {
      q: currentMarketplaceState.q,
      category: currentMarketplaceState.category,
      sort: currentMarketplaceState.sort,
      page: currentMarketplaceState.page,
    });

    if (!data.results || data.results.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-inbox fs-1 text-secondary d-block mb-2"></i>
          <h5 class="fw-bold text-light">No services found</h5>
          <p class="text-secondary small">Try adjusting your search query or category filter.</p>
        </div>
      `;
      if (pagination) pagination.classList.add("d-none");
      return;
    }

    const currentUserId = window.currentUser?.id;

    grid.innerHTML = data.results.map((svc) => {
      const meta = getCategoryMeta(svc.category);
      const isOwner = currentUserId && svc.owner.id === currentUserId;
      const skillsHtml = (svc.skills || []).map((sk) =>
        `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle small me-1">${esc(sk)}</span>`
      ).join("");

      return `
        <div class="col-md-6 col-lg-4">
          <div class="service-card glass-panel h-100 d-flex flex-column p-4">
            <div class="service-art-banner mb-3 rounded d-flex align-items-center justify-content-center position-relative"
                 style="height: 120px; background: ${meta.gradient}; border: 1px solid rgba(255,255,255,0.08);">
              <i class="bi ${meta.icon} fs-1 text-light opacity-75"></i>
              ${isOwner ? `<span class="badge bg-info text-dark position-absolute top-0 end-0 m-2">Your Service</span>` : ""}
            </div>

            <div class="d-flex justify-content-between align-items-center mb-2">
              <span class="badge bg-dark-subtle text-light border border-secondary-subtle">${esc(svc.category)}</span>
              <span class="fw-bold text-cyan fs-5">${esc(svc.credit_cost)} <small class="text-secondary fs-6">credits</small></span>
            </div>

            <h5 class="fw-bold mb-2 text-light">${esc(svc.title)}</h5>
            <p class="text-secondary small flex-grow-1 mb-3">${esc(svc.description)}</p>

            <div class="mb-3">${skillsHtml}</div>

            <div class="d-flex justify-content-between align-items-center pt-3 border-top border-dark-subtle">
              <a href="#/users/${svc.owner.id}" class="text-decoration-none d-flex align-items-center gap-2 text-light">
                <div class="avatar-mini">${getInitials(svc.owner.full_name || svc.owner.handle)}</div>
                <div>
                  <div class="small fw-semibold">${esc(svc.owner.full_name || svc.owner.handle)}</div>
                  <div class="text-secondary" style="font-size: 0.72rem;">
                    ${svc.owner.rating ? `★ ${svc.owner.rating}` : "New provider"} · ${esc(svc.delivery_days)}d delivery
                  </div>
                </div>
              </a>

              ${isOwner ? `
                <div class="d-flex gap-1">
                  <button class="btn btn-sm btn-outline-secondary btn-edit-service" data-id="${svc.id}">Edit</button>
                  <button class="btn btn-sm btn-outline-danger btn-deactivate-service" data-id="${svc.id}">Remove</button>
                </div>
              ` : `
                <button class="btn btn-sm btn-primary btn-request-service" data-id="${svc.id}" data-title="${esc(svc.title)}" data-cost="${svc.credit_cost}" data-owner="${esc(svc.owner.full_name || svc.owner.handle)}">
                  Request
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Attach button listeners
    grid.querySelectorAll(".btn-request-service").forEach((b) => {
      b.addEventListener("click", () => {
        const svcId = b.getAttribute("data-id");
        const title = b.getAttribute("data-title");
        const cost = parseInt(b.getAttribute("data-cost"), 10);
        const owner = b.getAttribute("data-owner");
        openRequestServiceModal(svcId, title, cost, owner);
      });
    });

    grid.querySelectorAll(".btn-edit-service").forEach((b) => {
      b.addEventListener("click", () => {
        const svcId = b.getAttribute("data-id");
        openEditServiceModal(svcId);
      });
    });

    grid.querySelectorAll(".btn-deactivate-service").forEach((b) => {
      b.addEventListener("click", () => {
        const svcId = b.getAttribute("data-id");
        confirmDialog({
          title: "Deactivate Service",
          message: "Are you sure you want to deactivate this service? Existing swaps will not be affected, but no new requests can be made.",
          confirmText: "Deactivate",
          confirmClass: "btn-danger",
          onConfirm: async () => {
            try {
              await api.delete(`services/${svcId}/`);
              showToast("Service deactivated.", "success");
              loadMarketplaceServices();
            } catch (err) {
              showToast(err.detail || "Failed to deactivate.", "error");
            }
          },
        });
      });
    });

    // Update pagination
    if (pagination) {
      if (data.total_pages > 1) {
        pagination.classList.remove("d-none");
        document.getElementById("marketplace-page-info").textContent = `Page ${data.page} of ${data.total_pages}`;
        document.getElementById("btn-page-prev").disabled = data.page <= 1;
        document.getElementById("btn-page-next").disabled = data.page >= data.total_pages;
      } else {
        pagination.classList.add("d-none");
      }
    }
  } catch (err) {
    grid.innerHTML = `<div class="col-12 text-center text-danger py-4">${esc(err.detail || "Failed to load services.")}</div>`;
  }
}

function openRequestServiceModal(serviceId, title, cost, ownerName) {
  if (!window.currentUser) {
    showToast("Please sign in to request services.", "info");
    window.location.hash = "#/signin";
    return;
  }

  const available = window.currentUser.balances?.available ?? 0;
  const hasEnough = available >= cost;
  const diff = cost - available;

  const html = `
    <div class="modal-backdrop-custom" data-action="close-modal">
      <div class="modal-card-custom" style="max-width: 520px;" onclick="event.stopPropagation()">
        <div class="modal-header-custom">
          <div>
            <span class="badge bg-cyan-subtle text-cyan mb-1">New Swap Request</span>
            <h4 class="modal-title-custom mb-0">${esc(title)}</h4>
          </div>
          <button type="button" class="btn-close-modal" data-action="close-modal">&times;</button>
        </div>

        <div class="modal-body-custom">
          <div class="glass-panel p-3 mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span class="text-secondary small">Provider</span>
              <span class="fw-semibold text-light">${esc(ownerName)}</span>
            </div>
            <div class="d-flex justify-content-between mb-1">
              <span class="text-secondary small">Service Cost</span>
              <span class="fw-bold text-cyan">${cost} credits</span>
            </div>
            <div class="d-flex justify-content-between pt-2 border-top border-dark-subtle">
              <span class="text-secondary small">Your Available Balance</span>
              <span class="fw-semibold ${hasEnough ? "text-success" : "text-danger"}">${available} credits</span>
            </div>
          </div>

          ${!hasEnough ? `
            <div class="alert alert-warning py-2 small mb-3">
              <i class="bi bi-exclamation-triangle-fill me-1"></i>
              You need <strong>${diff}</strong> more credits to hire this service.
              <div class="mt-1 text-secondary">Tip: Publish your skills on Swapski to earn credits when other members hire you!</div>
            </div>
          ` : `
            <div class="alert alert-info py-2 small mb-3">
              <i class="bi bi-shield-check me-1"></i>
              ${cost} credits will be safely held in escrow until you inspect and approve the work.
            </div>
          `}

          <form id="request-service-form">
            <div class="mb-3">
              <label class="form-label small text-secondary">What do you need done? (Required)</label>
              <textarea name="message" class="form-control" rows="4"
                        placeholder="Describe your project goals, links, context, or specific requirements..." required></textarea>
            </div>
            <div class="d-flex justify-content-end gap-2">
              <button type="button" class="btn btn-outline-secondary" data-action="close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-swap-request" ${!hasEnough ? "disabled" : ""}>
                <i class="bi bi-lock-fill me-1"></i>Lock ${cost} Credits &amp; Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  openModal(html);

  const form = document.getElementById("request-service-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-swap-request");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Creating request...`;

    const message = form.message.value.trim();

    try {
      const swap = await api.post("swaps/", {
        service_id: serviceId,
        message,
      });

      // Update cached user balance
      if (window.currentUser && window.currentUser.balances) {
        window.currentUser.balances.available -= cost;
        window.currentUser.balances.escrow += cost;
      }

      closeModal();
      showToast("Swap request created! Credits locked in escrow.", "success");
      window.location.hash = `#/swaps/${swap.id}`;
    } catch (err) {
      showToast(err.detail || "Failed to create request.", "error");
      btn.disabled = false;
      btn.textContent = `Lock ${cost} Credits & Request`;
    }
  });
}

function openCreateServiceModal() {
  if (!window.currentUser) {
    showToast("Please sign in first.", "info");
    return;
  }

  const categoryOptions = cachedCategories.map((c) =>
    `<option value="${c.id}">${esc(c.name)}</option>`
  ).join("");

  const html = `
    <div class="modal-backdrop-custom" data-action="close-modal">
      <div class="modal-card-custom" style="max-width: 550px;" onclick="event.stopPropagation()">
        <div class="modal-header-custom">
          <h4 class="modal-title-custom">Publish a New Service</h4>
          <button type="button" class="btn-close-modal" data-action="close-modal">&times;</button>
        </div>
        <div class="modal-body-custom">
          <form id="create-service-form" class="d-flex flex-column gap-3">
            <div>
              <label class="form-label small text-secondary">Service Title (min 5 chars)</label>
              <input type="text" name="title" class="form-control" placeholder="e.g. Build your landing page in Bootstrap" required />
            </div>
            <div>
              <label class="form-label small text-secondary">Category</label>
              <select name="category_id" class="form-select" required>
                ${categoryOptions}
              </select>
            </div>
            <div>
              <label class="form-label small text-secondary">Description</label>
              <textarea name="description" class="form-control" rows="3" placeholder="Describe the deliverables, process, and tools you will use..." required></textarea>
            </div>
            <div class="row g-2">
              <div class="col-6">
                <label class="form-label small text-secondary">Credit Cost (10 - 1,000)</label>
                <input type="number" name="credit_cost" class="form-control" min="10" max="1000" value="100" required />
              </div>
              <div class="col-6">
                <label class="form-label small text-secondary">Delivery Days (1 - 30)</label>
                <input type="number" name="delivery_days" class="form-control" min="1" max="30" value="3" required />
              </div>
            </div>
            <div>
              <label class="form-label small text-secondary">Relevant Skills (comma separated, max 5)</label>
              <input type="text" name="skills" class="form-control" placeholder="e.g. Frontend Dev, HTML, Bootstrap" />
            </div>
            <div class="d-flex justify-content-end gap-2 mt-2 pt-2 border-top border-dark-subtle">
              <button type="button" class="btn btn-outline-secondary" data-action="close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-save-service">Publish Service</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  openModal(html);

  const form = document.getElementById("create-service-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-save-service");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Publishing...`;

    const skills = form.skills.value.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      await api.post("services/", {
        title: form.title.value.trim(),
        category_id: parseInt(form.category_id.value, 10),
        description: form.description.value.trim(),
        credit_cost: parseInt(form.credit_cost.value, 10),
        delivery_days: parseInt(form.delivery_days.value, 10),
        skills,
      });

      closeModal();
      showToast("Service published to marketplace!", "success");
      loadMarketplaceServices();
    } catch (err) {
      showToast(err.detail || "Failed to publish service.", "error");
      btn.disabled = false;
      btn.textContent = "Publish Service";
    }
  });
}

async function openEditServiceModal(serviceId) {
  try {
    const svc = await api.get(`services/${serviceId}/`);
    const categoryOptions = cachedCategories.map((c) =>
      `<option value="${c.id}" ${c.name === svc.category ? "selected" : ""}>${esc(c.name)}</option>`
    ).join("");

    const html = `
      <div class="modal-backdrop-custom" data-action="close-modal">
        <div class="modal-card-custom" style="max-width: 550px;" onclick="event.stopPropagation()">
          <div class="modal-header-custom">
            <h4 class="modal-title-custom">Edit Service</h4>
            <button type="button" class="btn-close-modal" data-action="close-modal">&times;</button>
          </div>
          <div class="modal-body-custom">
            <form id="edit-service-form" class="d-flex flex-column gap-3">
              <div>
                <label class="form-label small text-secondary">Service Title</label>
                <input type="text" name="title" class="form-control" value="${esc(svc.title)}" required />
              </div>
              <div>
                <label class="form-label small text-secondary">Category</label>
                <select name="category_id" class="form-select" required>
                  ${categoryOptions}
                </select>
              </div>
              <div>
                <label class="form-label small text-secondary">Description</label>
                <textarea name="description" class="form-control" rows="3" required>${esc(svc.description)}</textarea>
              </div>
              <div class="row g-2">
                <div class="col-6">
                  <label class="form-label small text-secondary">Credit Cost</label>
                  <input type="number" name="credit_cost" class="form-control" min="10" max="1000" value="${svc.credit_cost}" required />
                </div>
                <div class="col-6">
                  <label class="form-label small text-secondary">Delivery Days</label>
                  <input type="number" name="delivery_days" class="form-control" min="1" max="30" value="${svc.delivery_days}" required />
                </div>
              </div>
              <div>
                <label class="form-label small text-secondary">Relevant Skills (comma separated, max 5)</label>
                <input type="text" name="skills" class="form-control" value="${esc((svc.skills || []).join(", "))}" />
              </div>
              <div class="d-flex justify-content-end gap-2 mt-2 pt-2 border-top border-dark-subtle">
                <button type="button" class="btn btn-outline-secondary" data-action="close-modal">Cancel</button>
                <button type="submit" class="btn btn-primary" id="btn-update-service">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;

    openModal(html);

    const form = document.getElementById("edit-service-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("btn-update-service");
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;

      const skills = form.skills.value.split(",").map((s) => s.trim()).filter(Boolean);

      try {
        await api.patch(`services/${serviceId}/`, {
          title: form.title.value.trim(),
          category_id: parseInt(form.category_id.value, 10),
          description: form.description.value.trim(),
          credit_cost: parseInt(form.credit_cost.value, 10),
          delivery_days: parseInt(form.delivery_days.value, 10),
          skills,
        });

        closeModal();
        showToast("Service updated successfully.", "success");
        loadMarketplaceServices();
      } catch (err) {
        showToast(err.detail || "Failed to update service.", "error");
        btn.disabled = false;
        btn.textContent = "Save Changes";
      }
    });
  } catch (err) {
    showToast(err.detail || "Failed to fetch service details.", "error");
  }
}

window.renderMarketplace = renderMarketplace;
window.openCreateServiceModal = openCreateServiceModal;
window.openRequestServiceModal = openRequestServiceModal;
