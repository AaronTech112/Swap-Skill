// static/js/ui.js - Escaping, toasts, modals, formatting, and category visuals

function esc(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeHref(url) {
  if (!url) return "#";
  const trimmed = String(url).trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return esc(trimmed);
  }
  return "#";
}

function getInitials(name) {
  if (!name) return "SW";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const CATEGORY_META = {
  Development: { icon: "bi-code-slash", gradient: "linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(99, 102, 241, 0.3))" },
  Design: { icon: "bi-palette", gradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(168, 85, 247, 0.3))" },
  Creative: { icon: "bi-film", gradient: "linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(234, 179, 8, 0.3))" },
  Research: { icon: "bi-search", gradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(6, 182, 212, 0.3))" },
  Strategy: { icon: "bi-compass", gradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(59, 130, 246, 0.3))" },
  Marketing: { icon: "bi-megaphone", gradient: "linear-gradient(135deg, rgba(244, 63, 94, 0.3), rgba(249, 115, 22, 0.3))" },
  Tutoring: { icon: "bi-mortarboard", gradient: "linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(59, 130, 246, 0.3))" },
};

function getCategoryMeta(catName) {
  return CATEGORY_META[catName] || {
    icon: "bi-stars",
    gradient: "linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))",
  };
}

function formatDate(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return isoStr;
  }
}

function formatRelativeTime(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return "just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch (e) {
    return isoStr;
  }
}

function showToast(message, type = "info") {
  const stack = document.getElementById("toast-stack");
  if (!stack) return;

  const toast = document.createElement("div");
  toast.className = `toast-item toast-${type}`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <div class="toast-content">
      <i class="bi ${type === "success" ? "bi-check-circle-fill text-success" : type === "error" ? "bi-exclamation-triangle-fill text-danger" : "bi-info-circle-fill text-info"}"></i>
      <span>${esc(message)}</span>
    </div>
    <button type="button" class="btn-close btn-close-white" aria-label="Close"></button>
  `;

  toast.querySelector(".btn-close").addEventListener("click", () => {
    toast.remove();
  });

  stack.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.classList.add("toast-fade-out");
      setTimeout(() => toast.remove(), 300);
    }
  }, 4500);
}

function openModal(html) {
  const root = document.getElementById("modal-root");
  if (!root) return;
  root.innerHTML = html;
  root.style.display = "block";
  document.body.classList.add("modal-open");
}

function closeModal() {
  const root = document.getElementById("modal-root");
  if (!root) return;
  root.innerHTML = "";
  root.style.display = "none";
  document.body.classList.remove("modal-open");
}

function confirmDialog({ title, message, confirmText = "Confirm", confirmClass = "btn-primary", onConfirm }) {
  const html = `
    <div class="modal-backdrop-custom" data-action="close-modal">
      <div class="modal-card-custom" onclick="event.stopPropagation()">
        <div class="modal-header-custom">
          <h4 class="modal-title-custom">${esc(title)}</h4>
          <button type="button" class="btn-close-modal" data-action="close-modal">&times;</button>
        </div>
        <div class="modal-body-custom">
          <p class="text-secondary">${esc(message)}</p>
        </div>
        <div class="modal-footer-custom">
          <button type="button" class="btn btn-outline-secondary" data-action="close-modal">Cancel</button>
          <button type="button" class="btn ${esc(confirmClass)}" id="confirm-dialog-btn">${esc(confirmText)}</button>
        </div>
      </div>
    </div>
  `;
  openModal(html);
  document.getElementById("confirm-dialog-btn").addEventListener("click", async () => {
    closeModal();
    if (onConfirm) await onConfirm();
  });
}

window.esc = esc;
window.safeHref = safeHref;
window.getInitials = getInitials;
window.getCategoryMeta = getCategoryMeta;
window.formatDate = formatDate;
window.formatRelativeTime = formatRelativeTime;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.confirmDialog = confirmDialog;
