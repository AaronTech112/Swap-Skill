// static/js/pages/settings.js - User settings: password change, theme toggle, and session logout

async function renderSettings() {
  const container = document.getElementById("app-main-content") || document.getElementById("app");
  if (!container) return;

  const currentTheme = localStorage.getItem("swapski-theme") || "dark";
  const user = window.currentUser || {};

  container.innerHTML = `
    <div class="py-4" style="max-width: 700px; margin: 0 auto;">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="fw-bold mb-1">Account Settings</h2>
          <p class="text-secondary small mb-0">Manage security, theme preferences, and your account session.</p>
        </div>
      </div>

      <!-- Theme Preferences Card -->
      <div class="glass-panel p-4 mb-4">
        <h5 class="fw-bold mb-2">Display Theme</h5>
        <p class="text-secondary small mb-3">Choose between dark midnight mode and daylight mode.</p>

        <div class="d-flex gap-3">
          <button type="button" class="btn ${currentTheme === "dark" ? "btn-cyan" : "btn-outline-secondary"} btn-theme-toggle" data-theme="dark">
            <i class="bi bi-moon-stars me-1"></i>Dark Mode
          </button>
          <button type="button" class="btn ${currentTheme === "light" ? "btn-cyan" : "btn-outline-secondary"} btn-theme-toggle" data-theme="light">
            <i class="bi bi-sun me-1"></i>Light Mode
          </button>
        </div>
      </div>

      <!-- Security / Change Password -->
      <div class="glass-panel p-4 mb-4">
        <h5 class="fw-bold mb-2">Change Password</h5>
        <p class="text-secondary small mb-3">Update your password to keep your Swapski account secure.</p>

        <div id="change-password-error" class="alert alert-danger py-2 small d-none" role="alert"></div>

        <form id="change-password-form" class="d-flex flex-column gap-3">
          <div>
            <label class="form-label small text-secondary">Current Password</label>
            <input type="password" name="current_password" class="form-control" required autocomplete="current-password" />
          </div>
          <div>
            <label class="form-label small text-secondary">New Password (min 8 chars)</label>
            <input type="password" name="new_password" class="form-control" minlength="8" required autocomplete="new-password" />
          </div>
          <div>
            <label class="form-label small text-secondary">Confirm New Password</label>
            <input type="password" name="confirm_password" class="form-control" minlength="8" required autocomplete="new-password" />
          </div>

          <div class="d-flex justify-content-end mt-2">
            <button type="submit" class="btn btn-primary" id="btn-submit-change-password">
              Update Password
            </button>
          </div>
        </form>
      </div>

      <!-- Account Session & Sign Out -->
      <div class="glass-panel p-4">
        <h5 class="fw-bold mb-2">Account Session</h5>
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <div class="small fw-semibold text-light">${esc(user.email || "")}</div>
            <div class="text-secondary small">Member since ${formatDate(user.date_joined)}</div>
          </div>
          <button type="button" class="btn btn-outline-danger btn-sm" id="btn-settings-logout">
            <i class="bi bi-box-arrow-right me-1"></i>Sign Out
          </button>
        </div>
      </div>
    </div>
  `;

  // Theme toggle
  container.querySelectorAll(".btn-theme-toggle").forEach((b) => {
    b.addEventListener("click", () => {
      const selected = b.getAttribute("data-theme");
      localStorage.setItem("swapski-theme", selected);
      document.documentElement.setAttribute("data-theme", selected);
      renderSettings();
      showToast(`Switched to ${selected} theme.`, "info");
    });
  });

  // Change password submit
  const pwForm = document.getElementById("change-password-form");
  pwForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errBox = document.getElementById("change-password-error");
    const btn = document.getElementById("btn-submit-change-password");
    errBox.classList.add("d-none");

    const current_password = pwForm.current_password.value;
    const new_password = pwForm.new_password.value;
    const confirm_password = pwForm.confirm_password.value;

    if (new_password !== confirm_password) {
      errBox.textContent = "New password and confirmation do not match.";
      errBox.classList.remove("d-none");
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Updating...`;

    try {
      await api.post("auth/change-password/", { current_password, new_password });
      pwForm.reset();
      showToast("Password updated successfully!", "success");
      btn.disabled = false;
      btn.textContent = "Update Password";
    } catch (err) {
      errBox.textContent = err.detail || err.message || "Failed to change password.";
      errBox.classList.remove("d-none");
      btn.disabled = false;
      btn.textContent = "Update Password";
    }
  });

  // Logout
  document.getElementById("btn-settings-logout")?.addEventListener("click", () => {
    confirmDialog({
      title: "Sign Out",
      message: "Are you sure you want to sign out of your account?",
      confirmText: "Sign Out",
      confirmClass: "btn-danger",
      onConfirm: async () => {
        try {
          await api.post("auth/logout/");
          window.currentUser = null;
          showToast("Signed out successfully.", "info");
          window.location.hash = "#/landing";
        } catch (e) {
          window.location.hash = "#/landing";
        }
      },
    });
  });
}

window.renderSettings = renderSettings;
