// static/js/pages/swaps.js - Swaps list, detail, lifecycle transitions, and chat thread

let currentSwapListFilter = {
  role: "all",
  status: "all",
};

let activeChatPollTimer = null;
let lastMessageId = 0;

function stopChatPolling() {
  if (activeChatPollTimer) {
    clearInterval(activeChatPollTimer);
    activeChatPollTimer = null;
  }
}

async function renderSwaps() {
  stopChatPolling();
  const container = document.getElementById("app-main-content") || document.getElementById("app");
  if (!container) return;

  container.innerHTML = `
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 class="fw-bold mb-1">My Swaps</h2>
          <p class="text-secondary small mb-0">Track all your active requests, deliveries, and past collaborations.</p>
        </div>
        <a href="#/marketplace" class="btn btn-outline-cyan btn-sm">
          <i class="bi bi-search me-1"></i>Find New Services
        </a>
      </div>

      <!-- Filters -->
      <div class="glass-panel p-3 mb-4">
        <div class="d-flex flex-wrap gap-3 align-items-center justify-content-between">
          <!-- Role Filters -->
          <div class="btn-group btn-group-sm" role="group">
            <button type="button" class="btn ${currentSwapListFilter.role === "all" ? "btn-primary" : "btn-outline-secondary"} btn-swap-role" data-role="all">
              All Roles
            </button>
            <button type="button" class="btn ${currentSwapListFilter.role === "requester" ? "btn-primary" : "btn-outline-secondary"} btn-swap-role" data-role="requester">
              I Hired (Requester)
            </button>
            <button type="button" class="btn ${currentSwapListFilter.role === "provider" ? "btn-primary" : "btn-outline-secondary"} btn-swap-role" data-role="provider">
              Hired Me (Provider)
            </button>
          </div>

          <!-- Status Filters -->
          <div class="d-flex gap-1 overflow-x-auto">
            ${["all", "requested", "in_progress", "review", "completed", "cancelled", "declined"].map((st) => `
              <button type="button" class="btn btn-sm ${currentSwapListFilter.status === st ? "btn-cyan" : "btn-outline-secondary"} btn-swap-status text-capitalize" data-status="${st}">
                ${st.replace("_", " ")}
              </button>
            `).join("")}
          </div>
        </div>
      </div>

      <!-- Swaps List Container -->
      <div id="swaps-list-container" class="d-flex flex-column gap-3">
        <div class="text-center py-5 text-secondary">
          <div class="spinner-border spinner-border-sm text-cyan me-2"></div>Loading swaps...
        </div>
      </div>
    </div>
  `;

  // Filter event listeners
  container.querySelectorAll(".btn-swap-role").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSwapListFilter.role = btn.getAttribute("data-role");
      renderSwaps();
    });
  });

  container.querySelectorAll(".btn-swap-status").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentSwapListFilter.status = btn.getAttribute("data-status");
      renderSwaps();
    });
  });

  await loadSwapsList();
}

async function loadSwapsList() {
  const listContainer = document.getElementById("swaps-list-container");
  if (!listContainer) return;

  try {
    const params = {};
    if (currentSwapListFilter.role !== "all") params.role = currentSwapListFilter.role;
    if (currentSwapListFilter.status !== "all") params.status = currentSwapListFilter.status;

    const swaps = await api.get("swaps/", params);

    if (!swaps || swaps.length === 0) {
      listContainer.innerHTML = `
        <div class="glass-panel text-center py-5">
          <i class="bi bi-arrow-repeat fs-1 text-secondary d-block mb-3"></i>
          <h5 class="fw-bold text-light">No swaps found</h5>
          <p class="text-secondary small mb-3">You don't have any swaps matching the selected filters.</p>
          <a href="#/marketplace" class="btn btn-primary btn-sm">Explore Marketplace</a>
        </div>
      `;
      return;
    }

    const currentUserId = window.currentUser?.id;

    listContainer.innerHTML = swaps.map((swap) => {
      const isRequester = swap.requester.id === currentUserId;
      const partner = isRequester ? swap.provider : swap.requester;
      const roleLabel = isRequester ? "You Hired" : "Delivering For";

      const statusBadges = {
        requested: "bg-warning-subtle text-warning border-warning-subtle",
        in_progress: "bg-info-subtle text-cyan border-info-subtle",
        review: "bg-purple-subtle text-purple border-purple-subtle",
        completed: "bg-success-subtle text-success border-success-subtle",
        cancelled: "bg-secondary-subtle text-secondary border-secondary-subtle",
        declined: "bg-danger-subtle text-danger border-danger-subtle",
      };
      const badgeCls = statusBadges[swap.status] || "bg-secondary-subtle text-secondary";

      return `
        <div class="glass-panel p-3 p-md-4 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 hover-panel"
             style="cursor: pointer;" onclick="window.location.hash='#/swaps/${swap.id}'">
          <div>
            <div class="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span class="badge border ${badgeCls} text-capitalize">${swap.status.replace("_", " ")}</span>
              <span class="badge bg-dark text-secondary border border-secondary-subtle">${roleLabel}</span>
              ${swap.unread_messages > 0 ? `<span class="badge bg-danger">${swap.unread_messages} unread</span>` : ""}
              <span class="small text-secondary">Created ${formatDate(swap.created_at)}</span>
            </div>
            <h5 class="fw-bold text-light mb-1">${esc(swap.service_title)}</h5>
            <div class="d-flex align-items-center gap-2 text-secondary small">
              <div class="avatar-mini">${getInitials(partner.full_name || partner.handle)}</div>
              <span>${esc(partner.full_name || partner.handle)}</span>
              <span>·</span>
              <span class="text-cyan fw-bold">${swap.credit_amount} credits</span>
              ${swap.due_at ? `<span>·</span><span>Due ${formatDate(swap.due_at)}</span>` : ""}
            </div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <a href="#/swaps/${swap.id}" class="btn btn-outline-light btn-sm" onclick="event.stopPropagation()">
              Open Swap <i class="bi bi-chevron-right ms-1"></i>
            </a>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    listContainer.innerHTML = `<div class="alert alert-danger py-3 text-center">${esc(err.detail || "Failed to load swaps.")}</div>`;
  }
}

async function renderSwapDetail(swapId) {
  stopChatPolling();
  const container = document.getElementById("app-main-content") || document.getElementById("app");
  if (!container) return;

  container.innerHTML = `
    <div class="py-4">
      <div class="text-center py-5 text-secondary">
        <div class="spinner-border spinner-border-sm text-cyan me-2"></div>Loading swap details...
      </div>
    </div>
  `;

  try {
    const swap = await api.get(`swaps/${swapId}/`);
    const currentUserId = window.currentUser?.id;
    const isRequester = swap.requester.id === currentUserId;
    const isProvider = swap.provider.id === currentUserId;
    const partner = isRequester ? swap.provider : swap.requester;

    // Status timeline active steps
    const steps = [
      { key: "requested", label: "Requested" },
      { key: "in_progress", label: "In Progress" },
      { key: "review", label: "In Review" },
      { key: "completed", label: "Completed" },
    ];
    const isTerminalFail = ["cancelled", "declined"].includes(swap.status);

    let currentStepIndex = steps.findIndex((s) => s.key === swap.status);
    if (swap.status === "in_progress") currentStepIndex = 1;
    if (swap.status === "review") currentStepIndex = 2;
    if (swap.status === "completed") currentStepIndex = 3;

    container.innerHTML = `
      <div class="py-3">
        <!-- Breadcrumb / Back button -->
        <div class="d-flex justify-content-between align-items-center mb-3">
          <a href="#/swaps" class="btn btn-link text-secondary text-decoration-none p-0">
            <i class="bi bi-arrow-left me-1"></i>Back to My Swaps
          </a>
          <span class="text-secondary small">Swap #${swap.id}</span>
        </div>

        <!-- Header Card -->
        <div class="glass-panel p-4 mb-4">
          <div class="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
            <div>
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="badge ${isTerminalFail ? "bg-danger" : "bg-cyan-subtle text-cyan border border-cyan-subtle"} text-capitalize">
                  ${swap.status.replace("_", " ")}
                </span>
                <span class="badge bg-dark-subtle text-secondary border border-secondary-subtle">
                  ${isRequester ? "You are Requester" : "You are Provider"}
                </span>
              </div>
              <h3 class="fw-bold text-light mb-1">${esc(swap.service_title)}</h3>
              <p class="text-secondary small mb-0">
                Created ${formatDate(swap.created_at)}
                ${swap.due_at ? `· Due ${formatDate(swap.due_at)}` : ""}
                ${swap.completed_at ? `· Completed ${formatDate(swap.completed_at)}` : ""}
              </p>
            </div>

            <!-- Action Buttons Toolbar -->
            <div class="d-flex gap-2 flex-wrap" id="swap-actions-toolbar">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- Timeline Stepper -->
          ${!isTerminalFail ? `
            <div class="swap-stepper d-flex justify-content-between position-relative my-4 pt-2">
              <div class="stepper-line"></div>
              ${steps.map((st, idx) => {
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;
                return `
                  <div class="stepper-step text-center position-relative ${isPassed ? "step-passed" : ""} ${isCurrent ? "step-current" : ""}">
                    <div class="step-indicator rounded-circle mx-auto mb-1 d-flex align-items-center justify-content-center">
                      ${isPassed ? `<i class="bi bi-check-lg"></i>` : idx + 1}
                    </div>
                    <div class="step-label small ${isPassed ? "text-light fw-semibold" : "text-secondary"}">${st.label}</div>
                  </div>
                `;
              }).join("")}
            </div>
          ` : `
            <div class="alert alert-danger py-2 small mb-0">
              <i class="bi bi-x-circle me-1"></i>This swap was ${swap.status}. All locked credits were returned to the requester.
            </div>
          `}
        </div>

        <div class="row g-4">
          <!-- Main details & Deliveries & Chat -->
          <div class="col-lg-7">
            <!-- Deliveries Section -->
            <div class="glass-panel p-4 mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Deliverables</h5>
                ${isProvider && swap.status === "in_progress" ? `
                  <button class="btn btn-sm btn-primary" id="btn-submit-delivery">
                    <i class="bi bi-upload me-1"></i>Submit Deliverable
                  </button>
                ` : ""}
              </div>

              <div id="swap-deliveries-list">
                ${(!swap.deliveries || swap.deliveries.length === 0) ? `
                  <p class="text-secondary small mb-0">No deliverables submitted yet.</p>
                ` : swap.deliveries.map((deliv) => `
                  <div class="deliverable-item p-3 rounded mb-2" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge bg-secondary-subtle text-secondary small">Submitted ${formatDate(deliv.created_at)}</span>
                      <span class="small text-secondary">by ${esc(deliv.created_by.full_name || deliv.created_by.handle)}</span>
                    </div>
                    ${deliv.note ? `<p class="text-light small mb-2">${esc(deliv.note)}</p>` : ""}
                    <div class="d-flex gap-2 flex-wrap">
                      ${deliv.link ? `
                        <a href="${safeHref(deliv.link)}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline-cyan">
                          <i class="bi bi-box-arrow-up-right me-1"></i>View Link
                        </a>
                      ` : ""}
                      ${deliv.has_file ? `
                        <a href="/api/deliveries/${deliv.id}/download/" class="btn btn-sm btn-outline-light" download>
                          <i class="bi bi-download me-1"></i>Download File (${esc(deliv.file_name || "file")})
                        </a>
                      ` : ""}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- Real-time Chat Thread -->
            <div class="glass-panel p-4 mb-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Conversation &amp; Timeline</h5>
                <span class="text-secondary small" id="chat-status-indicator">
                  <span class="spinner-grow spinner-grow-sm text-cyan me-1" style="width: 8px; height: 8px;"></span>Live
                </span>
              </div>

              <!-- Message History Scrollbox -->
              <div id="swap-chat-messages" class="chat-messages-box p-3 rounded mb-3"
                   style="height: 340px; overflow-y: auto; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06);">
                <div class="text-center text-secondary small py-5">Loading messages...</div>
              </div>

              <!-- Chat Input -->
              <form id="swap-chat-form" class="d-flex gap-2">
                <input type="text" id="swap-chat-input" class="form-control" placeholder="Type a message or project update..." required autocomplete="off" />
                <button type="submit" class="btn btn-primary px-3" id="swap-chat-send-btn">
                  <i class="bi bi-send-fill"></i>
                </button>
              </form>
            </div>
          </div>

          <!-- Sidebar: Partner info, Escrow Ledger, Reviews -->
          <div class="col-lg-5">
            <!-- Partner Profile Card -->
            <div class="glass-panel p-4 mb-4">
              <h6 class="text-secondary small mb-3 text-uppercase fw-semibold">Collaboration Partner</h6>
              <div class="d-flex align-items-center gap-3">
                <div class="avatar-large">${getInitials(partner.full_name || partner.handle)}</div>
                <div>
                  <h5 class="fw-bold text-light mb-0">${esc(partner.full_name || partner.handle)}</h5>
                  <div class="text-secondary small">${esc(partner.handle)}</div>
                  <a href="#/users/${partner.id}" class="btn btn-sm btn-outline-cyan mt-2">
                    <i class="bi bi-person me-1"></i>View Public Profile
                  </a>
                </div>
              </div>
            </div>

            <!-- Escrow & Ledger Card -->
            <div class="glass-panel p-4 mb-4">
              <h6 class="text-secondary small mb-3 text-uppercase fw-semibold">Credit Ledger</h6>
              <div class="d-flex justify-content-between align-items-center p-3 rounded mb-3"
                   style="background: rgba(56, 189, 248, 0.08); border: 1px solid rgba(56, 189, 248, 0.2);">
                <div>
                  <div class="small text-secondary">Swap Agreement Cost</div>
                  <div class="fs-4 fw-bold text-cyan">${swap.credit_amount} credits</div>
                </div>
                <i class="bi bi-shield-lock-fill fs-2 text-cyan"></i>
              </div>

              <div class="ledger-transactions">
                <div class="small text-secondary mb-2">Ledger Entries:</div>
                ${(!swap.ledger_lines || swap.ledger_lines.length === 0) ? `
                  <div class="text-secondary small">No ledger entries recorded yet.</div>
                ` : swap.ledger_lines.map((entry) => `
                  <div class="d-flex justify-content-between align-items-center py-2 border-bottom border-dark-subtle small">
                    <div>
                      <span class="badge ${entry.type === "EARN" ? "bg-success" : entry.type === "REFUND" ? "bg-info text-dark" : "bg-warning text-dark"} me-1">
                        ${entry.type}
                      </span>
                      <span class="text-secondary">${esc(entry.description)}</span>
                    </div>
                    <span class="fw-bold ${entry.amount > 0 ? "text-success" : "text-warning"} text-nowrap">
                      ${entry.amount > 0 ? `+${entry.amount}` : entry.amount} cr
                    </span>
                  </div>
                `).join("")}
              </div>
            </div>

            <!-- Reviews Card (If completed) -->
            ${swap.status === "completed" ? `
              <div class="glass-panel p-4 mb-4">
                <h6 class="text-secondary small mb-3 text-uppercase fw-semibold">Reviews</h6>
                <div id="swap-reviews-box">
                  ${swap.user_review ? `
                    <div class="p-3 rounded mb-2" style="background: rgba(255,255,255,0.03);">
                      <div class="d-flex justify-content-between mb-1">
                        <span class="small fw-semibold text-light">Your Review</span>
                        <span class="text-warning small">${"★".repeat(swap.user_review.score)}</span>
                      </div>
                      <p class="small text-secondary mb-0">${esc(swap.user_review.text || "No written review.")}</p>
                    </div>
                  ` : `
                    <button class="btn btn-outline-cyan w-100 btn-sm mb-3" id="btn-leave-review">
                      <i class="bi bi-star me-1"></i>Leave a Review
                    </button>
                  `}

                  ${swap.partner_review ? `
                    <div class="p-3 rounded" style="background: rgba(255,255,255,0.03);">
                      <div class="d-flex justify-content-between mb-1">
                        <span class="small fw-semibold text-light">${esc(swap.partner_review.author_name)}'s Review</span>
                        <span class="text-warning small">${"★".repeat(swap.partner_review.score)}</span>
                      </div>
                      <p class="small text-secondary mb-0">${esc(swap.partner_review.text || "No written review.")}</p>
                    </div>
                  ` : `
                    <div class="text-secondary small text-center py-2">Partner has not left a review yet.</div>
                  `}
                </div>
              </div>
            ` : ""}
          </div>
        </div>
      </div>
    `;

    renderSwapActionButtons(swap);
    setupChatThread(swapId);
  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger py-4 text-center my-4">
        <h5>Could not load swap</h5>
        <p class="small mb-3">${esc(err.detail || "Swap not found or access denied.")}</p>
        <a href="#/swaps" class="btn btn-outline-light btn-sm">Return to My Swaps</a>
      </div>
    `;
  }
}

function renderSwapActionButtons(swap) {
  const toolbar = document.getElementById("swap-actions-toolbar");
  if (!toolbar) return;

  const actions = swap.available_actions || [];

  toolbar.innerHTML = actions.map((act) => {
    if (act === "accept") {
      return `<button class="btn btn-success btn-sm" id="btn-action-accept"><i class="bi bi-check-circle me-1"></i>Accept Request</button>`;
    }
    if (act === "decline") {
      return `<button class="btn btn-outline-danger btn-sm" id="btn-action-decline"><i class="bi bi-x-circle me-1"></i>Decline</button>`;
    }
    if (act === "cancel") {
      return `<button class="btn btn-outline-danger btn-sm" id="btn-action-cancel"><i class="bi bi-x-circle me-1"></i>Cancel Request</button>`;
    }
    if (act === "deliver") {
      return `<button class="btn btn-primary btn-sm" id="btn-action-deliver"><i class="bi bi-upload me-1"></i>Deliver Work</button>`;
    }
    if (act === "request_changes") {
      return `<button class="btn btn-warning btn-sm" id="btn-action-changes"><i class="bi bi-arrow-repeat me-1"></i>Request Changes</button>`;
    }
    if (act === "approve") {
      return `<button class="btn btn-success btn-sm" id="btn-action-approve"><i class="bi bi-check2-all me-1"></i>Approve &amp; Release Credits</button>`;
    }
    if (act === "review") {
      return `<button class="btn btn-outline-cyan btn-sm" id="btn-action-review"><i class="bi bi-star me-1"></i>Leave Review</button>`;
    }
    return "";
  }).join("");

  document.getElementById("btn-action-accept")?.addEventListener("click", () => {
    confirmDialog({
      title: "Accept Swap Request",
      message: `Accept this swap to begin work on '${swap.service_title}'. The due date will be calculated based on your delivery timeframe.`,
      confirmText: "Accept & Begin",
      confirmClass: "btn-success",
      onConfirm: async () => {
        try {
          await api.post(`swaps/${swap.id}/accept/`);
          showToast("Swap accepted! Status updated to In Progress.", "success");
          renderSwapDetail(swap.id);
        } catch (err) {
          showToast(err.detail || "Failed to accept swap.", "error");
        }
      },
    });
  });

  document.getElementById("btn-action-decline")?.addEventListener("click", () => {
    confirmDialog({
      title: "Decline Swap Request",
      message: `Decline this request? The ${swap.credit_amount} credits locked in escrow will be immediately refunded to ${swap.requester.full_name || swap.requester.handle}.`,
      confirmText: "Decline & Refund",
      confirmClass: "btn-danger",
      onConfirm: async () => {
        try {
          await api.post(`swaps/${swap.id}/decline/`);
          showToast("Swap declined and credits refunded.", "info");
          renderSwapDetail(swap.id);
        } catch (err) {
          showToast(err.detail || "Failed to decline swap.", "error");
        }
      },
    });
  });

  document.getElementById("btn-action-cancel")?.addEventListener("click", () => {
    confirmDialog({
      title: "Cancel Swap Request",
      message: `Cancel this swap request? Your ${swap.credit_amount} Swap Credits held in escrow will be immediately returned to your available balance.`,
      confirmText: "Cancel Request",
      confirmClass: "btn-danger",
      onConfirm: async () => {
        try {
          await api.post(`swaps/${swap.id}/cancel/`);
          showToast("Swap request cancelled. Credits refunded to your wallet.", "success");
          renderSwapDetail(swap.id);
        } catch (err) {
          showToast(err.detail || "Failed to cancel swap.", "error");
        }
      },
    });
  });

  const deliverHandler = () => openDeliverModal(swap.id);
  document.getElementById("btn-action-deliver")?.addEventListener("click", deliverHandler);
  document.getElementById("btn-submit-delivery")?.addEventListener("click", deliverHandler);

  document.getElementById("btn-action-changes")?.addEventListener("click", () => {
    openRequestChangesModal(swap.id);
  });

  document.getElementById("btn-action-approve")?.addEventListener("click", () => {
    confirmDialog({
      title: "Approve Deliverables",
      message: `Are you satisfied with the work? Approving will permanently release ${swap.credit_amount} Swap Credits from escrow to ${swap.provider.full_name || swap.provider.handle} and mark the swap completed.`,
      confirmText: "Approve & Release Credits",
      confirmClass: "btn-success",
      onConfirm: async () => {
        try {
          await api.post(`swaps/${swap.id}/approve/`);
          showToast("Swap approved! Credits released to provider.", "success");
          renderSwapDetail(swap.id);
        } catch (err) {
          showToast(err.detail || "Failed to approve swap.", "error");
        }
      },
    });
  });

  const reviewHandler = () => openReviewModal(swap.id);
  document.getElementById("btn-action-review")?.addEventListener("click", reviewHandler);
  document.getElementById("btn-leave-review")?.addEventListener("click", reviewHandler);
}

function openDeliverModal(swapId) {
  const html = `
    <div class="modal-backdrop-custom" data-action="close-modal">
      <div class="modal-card-custom" style="max-width: 520px;" onclick="event.stopPropagation()">
        <div class="modal-header-custom">
          <h4 class="modal-title-custom">Submit Deliverable</h4>
          <button type="button" class="btn-close-modal" data-action="close-modal">&times;</button>
        </div>
        <div class="modal-body-custom">
          <form id="deliver-form" class="d-flex flex-column gap-3">
            <div>
              <label class="form-label small text-secondary">Link to Work (URL)</label>
              <input type="url" name="link" class="form-control" placeholder="https://..." />
            </div>
            <div>
              <label class="form-label small text-secondary">Delivery Notes / Explanations</label>
              <textarea name="note" class="form-control" rows="3" placeholder="Explain what has been completed, key decisions, or next steps..."></textarea>
            </div>
            <div>
              <label class="form-label small text-secondary">Attach Deliverable File (Max 5 MB, optional)</label>
              <input type="file" name="file" class="form-control" />
              <div class="small text-secondary mt-1">Allowed: pdf, png, jpg, zip, docx, pptx, xlsx, txt, md, mp4.</div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-2 pt-2 border-top border-dark-subtle">
              <button type="button" class="btn btn-outline-secondary" data-action="close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-delivery-confirm">Submit for Review</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  openModal(html);

  const form = document.getElementById("deliver-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-delivery-confirm");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Submitting...`;

    const formData = new FormData();
    if (form.link.value.trim()) formData.append("link", form.link.value.trim());
    if (form.note.value.trim()) formData.append("note", form.note.value.trim());
    if (form.file.files[0]) formData.append("file", form.file.files[0]);

    try {
      await api.post(`swaps/${swapId}/deliver/`, formData);
      closeModal();
      showToast("Deliverable submitted! Swap is now under review.", "success");
      renderSwapDetail(swapId);
    } catch (err) {
      showToast(err.detail || "Failed to submit deliverable.", "error");
      btn.disabled = false;
      btn.textContent = "Submit for Review";
    }
  });
}

function openRequestChangesModal(swapId) {
  const html = `
    <div class="modal-backdrop-custom" data-action="close-modal">
      <div class="modal-card-custom" style="max-width: 500px;" onclick="event.stopPropagation()">
        <div class="modal-header-custom">
          <h4 class="modal-title-custom">Request Revisions</h4>
          <button type="button" class="btn-close-modal" data-action="close-modal">&times;</button>
        </div>
        <div class="modal-body-custom">
          <form id="request-changes-form" class="d-flex flex-column gap-3">
            <div>
              <label class="form-label small text-secondary">What revisions are needed? (Required)</label>
              <textarea name="note" class="form-control" rows="4" placeholder="Be specific about what changes are required before approval..." required></textarea>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-2 pt-2 border-top border-dark-subtle">
              <button type="button" class="btn btn-outline-secondary" data-action="close-modal">Cancel</button>
              <button type="submit" class="btn btn-warning" id="btn-submit-changes">Send Revision Request</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  openModal(html);

  const form = document.getElementById("request-changes-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = form.note.value.trim();
    const btn = document.getElementById("btn-submit-changes");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Sending...`;

    try {
      await api.post(`swaps/${swapId}/request-changes/`, { note });
      closeModal();
      showToast("Revision request sent! Status returned to In Progress.", "info");
      renderSwapDetail(swapId);
    } catch (err) {
      showToast(err.detail || "Failed to request changes.", "error");
      btn.disabled = false;
      btn.textContent = "Send Revision Request";
    }
  });
}

function openReviewModal(swapId) {
  const html = `
    <div class="modal-backdrop-custom" data-action="close-modal">
      <div class="modal-card-custom" style="max-width: 500px;" onclick="event.stopPropagation()">
        <div class="modal-header-custom">
          <h4 class="modal-title-custom">Leave a Review</h4>
          <button type="button" class="btn-close-modal" data-action="close-modal">&times;</button>
        </div>
        <div class="modal-body-custom">
          <form id="review-form" class="d-flex flex-column gap-3">
            <div>
              <label class="form-label small text-secondary">Rating (1 to 5 stars)</label>
              <div class="d-flex gap-2" id="star-rating-selector">
                ${[1, 2, 3, 4, 5].map((s) => `
                  <button type="button" class="btn btn-outline-secondary btn-star" data-score="${s}">
                    ${s} ★
                  </button>
                `).join("")}
              </div>
              <input type="hidden" name="score" value="5" />
            </div>
            <div>
              <label class="form-label small text-secondary">Review Feedback (Optional)</label>
              <textarea name="text" class="form-control" rows="3" placeholder="Share your experience working with this member..."></textarea>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-2 pt-2 border-top border-dark-subtle">
              <button type="button" class="btn btn-outline-secondary" data-action="close-modal">Cancel</button>
              <button type="submit" class="btn btn-primary" id="btn-submit-review">Submit Review</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  openModal(html);

  const starButtons = document.querySelectorAll(".btn-star");
  const scoreInput = document.querySelector('input[name="score"]');
  starButtons.forEach((b) => {
    if (b.getAttribute("data-score") === "5") {
      b.classList.add("btn-warning", "text-dark");
      b.classList.remove("btn-outline-secondary");
    }
    b.addEventListener("click", () => {
      const val = b.getAttribute("data-score");
      scoreInput.value = val;
      starButtons.forEach((other) => {
        if (parseInt(other.getAttribute("data-score"), 10) <= parseInt(val, 10)) {
          other.classList.add("btn-warning", "text-dark");
          other.classList.remove("btn-outline-secondary");
        } else {
          other.classList.remove("btn-warning", "text-dark");
          other.classList.add("btn-outline-secondary");
        }
      });
    });
  });

  const form = document.getElementById("review-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-review");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Submitting...`;

    const score = parseInt(form.score.value, 10);
    const text = form.text.value.trim();

    try {
      await api.post(`swaps/${swapId}/review/`, { score, text });
      closeModal();
      showToast("Thank you for your review!", "success");
      renderSwapDetail(swapId);
    } catch (err) {
      showToast(err.detail || "Failed to submit review.", "error");
      btn.disabled = false;
      btn.textContent = "Submit Review";
    }
  });
}

function setupChatThread(swapId) {
  const box = document.getElementById("swap-chat-messages");
  const form = document.getElementById("swap-chat-form");
  const input = document.getElementById("swap-chat-input");
  lastMessageId = 0;

  async function fetchMessages(isPoll = false) {
    if (!box) return;
    try {
      const messages = await api.get(`swaps/${swapId}/messages/`, isPoll ? { after: lastMessageId } : null);

      if (!isPoll) {
        box.innerHTML = "";
      }

      if (messages.length > 0) {
        messages.forEach((msg) => {
          if (msg.id > lastMessageId) lastMessageId = msg.id;

          const msgEl = document.createElement("div");
          if (msg.is_system) {
            msgEl.className = "chat-system-bubble text-center my-2 p-2 rounded";
            msgEl.innerHTML = `<span class="small text-secondary"><i class="bi bi-info-circle me-1"></i>${esc(msg.body)} · ${formatRelativeTime(msg.created_at)}</span>`;
          } else {
            const isMe = msg.sender === window.currentUser?.id;
            msgEl.className = `chat-bubble-container d-flex flex-column my-2 ${isMe ? "align-items-end" : "align-items-start"}`;
            msgEl.innerHTML = `
              <div class="small text-secondary mb-1" style="font-size: 0.72rem;">
                ${esc(msg.sender_name)} · ${formatRelativeTime(msg.created_at)}
              </div>
              <div class="chat-bubble p-2 px-3 rounded ${isMe ? "bg-primary text-white" : "glass-panel text-light"}" style="max-width: 80%;">
                ${esc(msg.body)}
              </div>
            `;
          }
          box.appendChild(msgEl);
        });

        box.scrollTop = box.scrollHeight;
      } else if (!isPoll) {
        box.innerHTML = `<div class="text-center text-secondary small py-4">No messages yet. Send a message to start communicating.</div>`;
      }
    } catch (err) {
      if (!isPoll) {
        box.innerHTML = `<div class="text-center text-danger small py-4">Failed to load messages.</div>`;
      }
    }
  }

  fetchMessages(false);

  // Poll chat every 8 seconds while this thread is open
  stopChatPolling();
  activeChatPollTimer = setInterval(() => {
    if (window.location.hash.includes(`/swaps/${swapId}`) || window.location.hash.includes(`/messages`)) {
      fetchMessages(true);
    } else {
      stopChatPolling();
    }
  }, 8000);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = input.value.trim();
    if (!body) return;

    input.value = "";
    try {
      await api.post(`swaps/${swapId}/messages/`, { body });
      await fetchMessages(true);
    } catch (err) {
      showToast(err.detail || "Failed to send message.", "error");
    }
  });
}

window.renderSwaps = renderSwaps;
window.renderSwapDetail = renderSwapDetail;
window.setupChatThread = setupChatThread;
window.stopChatPolling = stopChatPolling;
