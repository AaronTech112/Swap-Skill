// static/js/pages/notifications.js - Real In-App Notifications

async function renderNotifications() {
  const container = document.getElementById("app-main-content") || document.getElementById("app");
  if (!container) return;

  container.innerHTML = `
    <div class="py-4" style="max-width: 800px; margin: 0 auto;">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 class="fw-bold mb-1">Notifications</h2>
          <p class="text-secondary small mb-0">Updates on your swaps, deliverables, reviews, and wallet balance.</p>
        </div>
        <button class="btn btn-outline-secondary btn-sm" id="btn-mark-all-read">
          <i class="bi bi-check2-all me-1"></i>Mark All Read
        </button>
      </div>

      <div id="notifications-list" class="d-flex flex-column gap-2">
        <div class="text-center py-5 text-secondary small">
          <div class="spinner-border spinner-border-sm text-cyan me-1"></div>Loading notifications...
        </div>
      </div>
    </div>
  `;

  document.getElementById("btn-mark-all-read")?.addEventListener("click", async () => {
    try {
      await api.post("notifications/read-all/");
      showToast("All notifications marked as read.", "success");
      renderNotifications();
      if (typeof refreshGlobalBadges === "function") refreshGlobalBadges();
    } catch (err) {
      showToast(err.detail || "Failed to mark notifications.", "error");
    }
  });

  await loadNotificationsList();
}

async function loadNotificationsList() {
  const list = document.getElementById("notifications-list");
  if (!list) return;

  try {
    const notifs = await api.get("notifications/");

    if (!notifs || notifs.length === 0) {
      list.innerHTML = `
        <div class="glass-panel text-center py-5">
          <i class="bi bi-bell-slash fs-1 text-secondary d-block mb-2"></i>
          <h6 class="fw-bold text-light">No notifications</h6>
          <p class="text-secondary small mb-0">You're completely up to date.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = notifs.map((n) => {
      const isUnread = !n.read_at;
      return `
        <div class="glass-panel p-3 d-flex justify-content-between align-items-start gap-3 notif-item ${isUnread ? "notif-unread" : ""}"
             style="${isUnread ? "border-left: 3px solid #00f2fe; background: rgba(0, 242, 254, 0.04);" : ""}">
          <div class="d-flex align-items-start gap-3 flex-grow-1">
            <div class="notif-icon mt-1">
              <i class="bi ${isUnread ? "bi-bell-fill text-cyan" : "bi-bell text-secondary"} fs-5"></i>
            </div>
            <div>
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="fw-bold small ${isUnread ? "text-light" : "text-secondary"}">${esc(n.title)}</span>
                ${isUnread ? `<span class="badge bg-cyan text-dark" style="font-size: 0.65rem;">New</span>` : ""}
              </div>
              <p class="small text-secondary mb-1">${esc(n.body)}</p>
              <span class="text-secondary" style="font-size: 0.72rem;">${formatRelativeTime(n.created_at)}</span>
            </div>
          </div>

          <div class="d-flex align-items-center gap-2">
            ${n.link ? `
              <a href="#/${esc(n.link)}" class="btn btn-sm btn-outline-cyan btn-notif-action" data-id="${n.id}">
                View
              </a>
            ` : ""}
            ${isUnread ? `
              <button class="btn btn-sm btn-link text-secondary p-0 btn-mark-read" data-id="${n.id}" title="Mark read">
                <i class="bi bi-check-lg fs-5"></i>
              </button>
            ` : ""}
          </div>
        </div>
      `;
    }).join("");

    list.querySelectorAll(".btn-notif-action").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        try {
          await api.post(`notifications/${id}/read/`);
          if (typeof refreshGlobalBadges === "function") refreshGlobalBadges();
        } catch (e) {}
      });
    });

    list.querySelectorAll(".btn-mark-read").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        try {
          await api.post(`notifications/${id}/read/`);
          loadNotificationsList();
          if (typeof refreshGlobalBadges === "function") refreshGlobalBadges();
        } catch (e) {}
      });
    });
  } catch (err) {
    list.innerHTML = `<div class="text-danger small py-3 text-center">Failed to load notifications.</div>`;
  }
}

window.renderNotifications = renderNotifications;
