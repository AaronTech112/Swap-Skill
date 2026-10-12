// static/js/pages/auth.js - Authentication & Onboarding pages

function renderSignIn() {
  const container = document.getElementById("app");
  container.innerHTML = `
    <div class="auth-page d-flex align-items-center justify-content-center min-vh-100 py-5">
      <div class="auth-card glass-panel p-4 p-md-5" style="max-width: 440px; width: 100%;">
        <div class="text-center mb-4">
          <a href="#/landing" class="text-decoration-none d-inline-flex align-items-center gap-2 mb-3">
            <img src="/static/img/SWAP.png" alt="Swapski" style="height: 36px;" />
            <span class="fs-4 fw-bold text-light">Swapski</span>
          </a>
          <h2 class="fw-bold mb-1">Welcome back</h2>
          <p class="text-secondary small">Sign in to manage your swaps and wallet</p>
        </div>

        <div id="auth-error-alert" class="alert alert-danger py-2 small d-none" role="alert"></div>

        <form id="signin-form" class="d-flex flex-column gap-3">
          <div>
            <label class="form-label small text-secondary">Email Address</label>
            <input type="email" name="email" class="form-control" placeholder="you@domain.com" required autocomplete="email" />
          </div>
          <div>
            <label class="form-label small text-secondary">Password</label>
            <input type="password" name="password" class="form-control" placeholder="••••••••" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary w-100 py-2 mt-2" id="signin-submit-btn">
            Sign In
          </button>
        </form>

        <div class="text-center mt-4 pt-3 border-top border-dark-subtle">
          <p class="text-secondary small mb-0">
            Don't have an account? <a href="#/signup" class="text-cyan text-decoration-none fw-semibold">Sign up (Get 300 credits)</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById("signin-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("signin-submit-btn");
    const errBox = document.getElementById("auth-error-alert");
    errBox.classList.add("d-none");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Signing in...`;

    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      const user = await api.post("auth/login/", { email, password });
      window.currentUser = user;
      showToast("Signed in successfully!", "success");
      window.location.hash = "#/dashboard";
    } catch (err) {
      errBox.textContent = err.detail || err.message || "Invalid credentials.";
      errBox.classList.remove("d-none");
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  });
}

function renderSignUp() {
  const container = document.getElementById("app");
  container.innerHTML = `
    <div class="auth-page d-flex align-items-center justify-content-center min-vh-100 py-5">
      <div class="auth-card glass-panel p-4 p-md-5" style="max-width: 480px; width: 100%;">
        <div class="text-center mb-4">
          <a href="#/landing" class="text-decoration-none d-inline-flex align-items-center gap-2 mb-3">
            <img src="/static/img/SWAP.png" alt="Swapski" style="height: 36px;" />
            <span class="fs-4 fw-bold text-light">Swapski</span>
          </a>
          <h2 class="fw-bold mb-1">Create your account</h2>
          <div class="badge-pill d-inline-flex mt-2 mb-1">
            <i class="bi bi-gift text-cyan"></i>
            <span>300 free Swap Credits credited instantly</span>
          </div>
        </div>

        <div id="signup-error-alert" class="alert alert-danger py-2 small d-none" role="alert"></div>

        <form id="signup-form" class="d-flex flex-column gap-3">
          <div>
            <label class="form-label small text-secondary">Full Name</label>
            <input type="text" name="full_name" class="form-control" placeholder="e.g. Amaka Okafor" required autocomplete="name" />
          </div>
          <div>
            <label class="form-label small text-secondary">Email Address</label>
            <input type="email" name="email" class="form-control" placeholder="you@domain.com" required autocomplete="email" />
          </div>
          <div>
            <label class="form-label small text-secondary">Password (min 8 characters)</label>
            <input type="password" name="password" class="form-control" placeholder="••••••••" minlength="8" required autocomplete="new-password" />
          </div>
          <button type="submit" class="btn btn-primary w-100 py-2 mt-2" id="signup-submit-btn">
            Create Account & Get 300 Credits
          </button>
        </form>

        <div class="text-center mt-4 pt-3 border-top border-dark-subtle">
          <p class="text-secondary small mb-0">
            Already have an account? <a href="#/signin" class="text-cyan text-decoration-none fw-semibold">Sign In</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById("signup-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("signup-submit-btn");
    const errBox = document.getElementById("signup-error-alert");
    errBox.classList.add("d-none");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Creating account...`;

    const full_name = form.full_name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      const user = await api.post("auth/register/", { full_name, email, password });
      window.currentUser = user;
      showToast("Account created! 300 Swap Credits added to your wallet.", "success");
      window.location.hash = "#/onboarding";
    } catch (err) {
      errBox.textContent = err.detail || err.message || "Failed to create account.";
      errBox.classList.remove("d-none");
      btn.disabled = false;
      btn.textContent = "Create Account & Get 300 Credits";
    }
  });
}

async function renderOnboarding() {
  const container = document.getElementById("app");
  const user = window.currentUser || {};

  container.innerHTML = `
    <div class="onboarding-page d-flex align-items-center justify-content-center min-vh-100 py-5">
      <div class="glass-panel p-4 p-md-5" style="max-width: 600px; width: 100%;">
        <div class="text-center mb-4">
          <span class="badge bg-primary-subtle text-primary border border-primary-subtle mb-2">Step 2 of 2</span>
          <h2 class="fw-bold mb-1">Set Up Your Profile</h2>
          <p class="text-secondary small">Tell the community what skills you offer and what you are looking for.</p>
        </div>

        <form id="onboarding-form" class="d-flex flex-column gap-3">
          <div>
            <label class="form-label small text-secondary">Professional Headline</label>
            <input type="text" name="headline" class="form-control" placeholder="e.g. Product designer swapping UI systems for backend help" value="${esc(user.headline || "")}" required />
          </div>
          <div>
            <label class="form-label small text-secondary">Location</label>
            <input type="text" name="location" class="form-control" placeholder="e.g. Lagos, Nigeria" value="${esc(user.location || "")}" />
          </div>
          <div>
            <label class="form-label small text-secondary">Bio / Summary</label>
            <textarea name="bio" class="form-control" rows="3" placeholder="Briefly describe your background, tools, and what kinds of projects you love working on...">${esc(user.bio || "")}</textarea>
          </div>
          <div>
            <label class="form-label small text-secondary">Skills You Offer (comma separated)</label>
            <input type="text" name="skills_offered" class="form-control" placeholder="e.g. UI Design, Brand Identity, Product Strategy" value="${esc((user.skills_offered || []).join(", "))}" />
            <small class="text-secondary">Skills you can trade or deliver to other members.</small>
          </div>
          <div>
            <label class="form-label small text-secondary">Skills You Want (comma separated)</label>
            <input type="text" name="skills_wanted" class="form-control" placeholder="e.g. Backend APIs, Automation, SEO" value="${esc((user.skills_wanted || []).join(", "))}" />
            <small class="text-secondary">Skills you plan to hire or swap for using your credits.</small>
          </div>

          <div class="d-flex justify-content-between align-items-center mt-3 pt-2">
            <a href="#/dashboard" class="btn btn-outline-secondary px-3">Skip for now</a>
            <button type="submit" class="btn btn-primary px-4" id="onboarding-save-btn">Complete &amp; Go to Dashboard</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const form = document.getElementById("onboarding-form");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("onboarding-save-btn");
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;

    const offered = form.skills_offered.value.split(",").map((s) => s.trim()).filter(Boolean);
    const wanted = form.skills_wanted.value.split(",").map((s) => s.trim()).filter(Boolean);

    try {
      const updated = await api.patch("me/", {
        headline: form.headline.value.trim(),
        location: form.location.value.trim(),
        bio: form.bio.value.trim(),
        skills_offered: offered,
        skills_wanted: wanted,
      });
      window.currentUser = updated;
      showToast("Profile set up! Welcome to Swapski.", "success");
      window.location.hash = "#/dashboard";
    } catch (err) {
      showToast(err.detail || "Failed to update profile.", "error");
      btn.disabled = false;
      btn.textContent = "Complete & Go to Dashboard";
    }
  });
}

window.renderSignIn = renderSignIn;
window.renderSignUp = renderSignUp;
window.renderOnboarding = renderOnboarding;
