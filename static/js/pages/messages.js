// static/js/pages/messages.js - Messages page with conversation list and shared chat thread

let activeSelectedSwapId = null;

async function renderMessages() {
  if (typeof stopChatPolling === "function") stopChatPolling();
  const container = document.getElementById("app-main-content") || document.getElementById("app");
  if (!container) return;

  container.innerHTML = `
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">Messages</h2>
          <p class="text-secondary small mb-0">Direct project communications with your swap partners.</p>
        </div>
      </div>

      <div class="row g-4" style="min-height: 550px;">
        <!-- Left: Conversation List -->
        <div class="col-md-4 col-lg-4">
          <div class="glass-panel p-3 h-100 d-flex flex-column">
            <h6 class="text-secondary small mb-3 text-uppercase fw-semibold">Conversations</h6>
            <div id="messages-conv-list" class="d-flex flex-column gap-2 overflow-y-auto flex-grow-1" style="max-height: 480px;">
              <div class="text-center py-4 text-secondary small">
                <div class="spinner-border spinner-border-sm text-cyan me-1"></div>Loading conversations...
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Active Thread Panel -->
        <div class="col-md-8 col-lg-8">
          <div class="glass-panel p-4 h-100 d-flex flex-column" id="messages-thread-panel">
            <div class="text-center py-5 my-auto text-secondary small">
              <i class="bi bi-chat-square-text fs-1 text-secondary d-block mb-3"></i>
              Select a conversation on the left to start messaging.
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const swaps = await api.get("swaps/");
    const convList = document.getElementById("messages-conv-list");
    if (!convList) return;

    if (!swaps || swaps.length === 0) {
      convList.innerHTML = `
        <div class="text-center py-4 text-secondary small">
          No swap conversations yet. Once you request or accept a swap, chat threads will appear here.
        </div>
      `;
      return;
    }

    const currentUserId = window.currentUser?.id;

    convList.innerHTML = swaps.map((s) => {
      const isReq = s.requester.id === currentUserId;
      const partner = isReq ? s.provider : s.requester;
      return `
        <div class="conv-item p-3 rounded cursor-pointer ${activeSelectedSwapId === s.id ? "active-conv-item" : ""}"
             style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); cursor: pointer;"
             data-swap-id="${s.id}">
          <div class="d-flex justify-content-between align-items-start mb-1">
            <div class="d-flex align-items-center gap-2">
              <div class="avatar-mini">${getInitials(partner.full_name || partner.handle)}</div>
              <div>
                <div class="fw-semibold text-light small">${esc(partner.full_name || partner.handle)}</div>
                <div class="text-secondary" style="font-size: 0.72rem;">${esc(partner.handle)}</div>
              </div>
            </div>
            ${s.unread_messages > 0 ? `<span class="badge bg-danger rounded-pill">${s.unread_messages}</span>` : ""}
          </div>
          <div class="small text-truncate text-secondary mt-1">${esc(s.service_title)}</div>
        </div>
      `;
    }).join("");

    convList.querySelectorAll(".conv-item").forEach((item) => {
      item.addEventListener("click", () => {
        const swapId = parseInt(item.getAttribute("data-swap-id"), 10);
        activeSelectedSwapId = swapId;
        convList.querySelectorAll(".conv-item").forEach((i) => i.classList.remove("active-conv-item"));
        item.classList.add("active-conv-item");
        loadThreadInMessages(swapId, swaps.find((s) => s.id === swapId));
      });
    });

    // Auto-select first conversation if available
    if (swaps.length > 0 && !activeSelectedSwapId) {
      activeSelectedSwapId = swaps[0].id;
      const firstEl = convList.querySelector(".conv-item");
      if (firstEl) firstEl.classList.add("active-conv-item");
      loadThreadInMessages(swaps[0].id, swaps[0]);
    } else if (activeSelectedSwapId) {
      const cur = swaps.find((s) => s.id === activeSelectedSwapId);
      if (cur) loadThreadInMessages(activeSelectedSwapId, cur);
    }
  } catch (err) {
    const convList = document.getElementById("messages-conv-list");
    if (convList) convList.innerHTML = `<div class="text-danger small py-3 text-center">Failed to load conversations.</div>`;
  }
}

function loadThreadInMessages(swapId, swapSummary) {
  const panel = document.getElementById("messages-thread-panel");
  if (!panel) return;

  const currentUserId = window.currentUser?.id;
  const partner = swapSummary.requester.id === currentUserId ? swapSummary.provider : swapSummary.requester;

  panel.innerHTML = `
    <div class="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom border-dark-subtle">
      <div class="d-flex align-items-center gap-3">
        <div class="avatar-medium">${getInitials(partner.full_name || partner.handle)}</div>
        <div>
          <h5 class="fw-bold text-light mb-0">${esc(partner.full_name || partner.handle)}</h5>
          <div class="text-secondary small">
            ${esc(swapSummary.service_title)} · <span class="text-cyan">${swapSummary.credit_amount} credits</span>
          </div>
        </div>
      </div>
      <a href="#/swaps/${swapId}" class="btn btn-outline-light btn-sm">
        <i class="bi bi-box-arrow-up-right me-1"></i>Swap Details
      </a>
    </div>

    <!-- Messages Container -->
    <div id="swap-chat-messages" class="chat-messages-box p-3 rounded mb-3 flex-grow-1"
         style="height: 380px; overflow-y: auto; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06);">
      <div class="text-center text-secondary small py-5">Loading thread...</div>
    </div>

    <!-- Input Form -->
    <form id="swap-chat-form" class="d-flex gap-2 mt-auto">
      <input type="text" id="swap-chat-input" class="form-control" placeholder="Type a message..." required autocomplete="off" />
      <button type="submit" class="btn btn-primary px-3" id="swap-chat-send-btn">
        <i class="bi bi-send-fill"></i>
      </button>
    </form>
  `;

  if (typeof setupChatThread === "function") {
    setupChatThread(swapId);
  }
}

window.renderMessages = renderMessages;
