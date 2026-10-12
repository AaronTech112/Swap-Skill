// static/js/pages/profile.js - Own editable profile & public member profile

async function renderProfile() {
  const container = document.getElementById("app-main-content") || document.getElementById("app");
  if (!container) return;

  container.innerHTML = `
    <div class="py-4">
      <div class="text-center py-5 text-secondary small">
        <div class="spinner-border spinner-border-sm text-cyan me-1"></div>Loading profile...
      </div>
    </div>
  `;

  try {
    const user = await api.get("me/");
    window.currentUser = user;

    container.innerHTML = `
      <div class="py-4" style="max-width: 900px; margin: 0 auto;">
        <!-- Header Banner -->
        <div class="glass-panel p-4 mb-4">
          <div class="d-flex align-items-center gap-4 flex-wrap">
            <div class="avatar-large" style="width: 80px; height: 80px; font-size: 1.8rem;">
              ${getInitials(user.full_name || user.handle)}
            </div>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2">
                <h3 class="fw-bold text-light mb-0">${esc(user.full_name || "Member")}</h3>
                <span class="badge bg-cyan text-dark">${esc(user.handle)}</span>
              </div>
              <p class="text-secondary small mb-2">${esc(user.headline || "No headline set yet.")}</p>
              <div class="d-flex gap-3 text-secondary small flex-wrap">
                ${user.location ? `<span><i class="bi bi-geo-alt me-1"></i>${esc(user.location)}</span>` : ""}
                <span><i class="bi bi-calendar3 me-1"></i>Joined ${formatDate(user.date_joined)}</span>
                <span><i class="bi bi-star-fill text-warning me-1"></i>${user.reputation?.rating ? `${user.reputation.rating} ★ (${user.reputation.review_count} reviews)` : "No reviews yet"}</span>
                <span><i class="bi bi-check2-circle text-success me-1"></i>${user.reputation?.completed_swaps || 0} completed swaps</span>
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Edit Profile Form -->
          <div class="col-lg-7">
            <div class="glass-panel p-4">
              <h5 class="fw-bold mb-3">Edit Profile Information</h5>
              <form id="edit-profile-form" class="d-flex flex-column gap-3">
                <div>
                  <label class="form-label small text-secondary">Full Name</label>
                  <input type="text" name="full_name" class="form-control" value="${esc(user.full_name || "")}" required />
                </div>
                <div>
                  <label class="form-label small text-secondary">Headline</label>
                  <input type="text" name="headline" class="form-control" value="${esc(user.headline || "")}" placeholder="e.g. Full-stack developer swapping code for design" />
                </div>
                <div>
                  <label class="form-label small text-secondary">Location</label>
                  <input type="text" name="location" class="form-control" value="${esc(user.location || "")}" placeholder="e.g. Lagos, Nigeria" />
                </div>
                <div>
                  <label class="form-label small text-secondary">Bio / About</label>
                  <textarea name="bio" class="form-control" rows="4" placeholder="Tell the community about your craft and experience...">${esc(user.bio || "")}</textarea>
                </div>
                <div>
                  <label class="form-label small text-secondary">Skills You Offer (comma separated)</label>
                  <input type="text" name="skills_offered" class="form-control" value="${esc((user.skills_offered || []).join(", "))}" placeholder="e.g. UI Design, Brand Identity, Pitch Decks" />
                </div>
                <div>
                  <label class="form-label small text-secondary">Skills You Want (comma separated)</label>
                  <input type="text" name="skills_wanted" class="form-control" value="${esc((user.skills_wanted || []).join(", "))}" placeholder="e.g. Backend APIs, Data Visualization" />
                </div>

                <div class="d-flex justify-content-end mt-2 pt-2 border-top border-dark-subtle">
                  <button type="submit" class="btn btn-primary" id="btn-save-profile">Save Changes</button>
                </div>
              </form>
            </div>
          </div>

          <!-- My Services Section -->
          <div class="col-lg-5">
            <div class="glass-panel p-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">My Services</h5>
                <button class="btn btn-sm btn-outline-cyan" id="btn-profile-add-svc">
                  <i class="bi bi-plus me-1"></i>New
                </button>
              </div>

              <div id="my-services-list" class="d-flex flex-column gap-2">
                <div class="text-secondary small py-3 text-center">
                  <div class="spinner-border spinner-border-sm text-cyan me-1"></div>Loading services...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Handle profile update submit
    const form = document.getElementById("edit-profile-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("btn-save-profile");
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Saving...`;

      const offered = form.skills_offered.value.split(",").map((s) => s.trim()).filter(Boolean);
      const wanted = form.skills_wanted.value.split(",").map((s) => s.trim()).filter(Boolean);

      try {
        const updated = await api.patch("me/", {
          full_name: form.full_name.value.trim(),
          headline: form.headline.value.trim(),
          location: form.location.value.trim(),
          bio: form.bio.value.trim(),
          skills_offered: offered,
          skills_wanted: wanted,
        });
        window.currentUser = updated;
        showToast("Profile updated successfully!", "success");
        renderProfile();
      } catch (err) {
        showToast(err.detail || "Failed to update profile.", "error");
        btn.disabled = false;
        btn.textContent = "Save Changes";
      }
    });

    document.getElementById("btn-profile-add-svc")?.addEventListener("click", () => {
      if (typeof openCreateServiceModal === "function") openCreateServiceModal();
    });

    loadMyServices();
  } catch (err) {
    showToast(err.detail || "Failed to load profile.", "error");
  }
}

async function loadMyServices() {
  const container = document.getElementById("my-services-list");
  if (!container) return;

  try {
    const services = await api.get("me/services/");
    if (!services || services.length === 0) {
      container.innerHTML = `
        <div class="text-secondary small py-3 text-center">
          You haven't published any services yet. Publishing a service allows other members to hire you and earn credits!
        </div>
      `;
      return;
    }

    container.innerHTML = services.map((svc) => `
      <div class="p-3 rounded mb-2" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="badge ${svc.is_active ? "bg-success-subtle text-success" : "bg-secondary-subtle text-secondary"} small">
            ${svc.is_active ? "Active" : "Deactivated"}
          </span>
          <span class="fw-bold text-cyan small">${svc.credit_cost} cr</span>
        </div>
        <div class="fw-semibold text-light small mb-1">${esc(svc.title)}</div>
        <div class="d-flex justify-content-between align-items-center pt-2 mt-1 border-top border-dark-subtle">
          <span class="text-secondary" style="font-size: 0.72rem;">${esc(svc.category)} · ${svc.delivery_days}d</span>
          <button class="btn btn-sm btn-link text-cyan p-0 text-decoration-none btn-profile-edit-svc" data-id="${svc.id}">
            Edit
          </button>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".btn-profile-edit-svc").forEach((b) => {
      b.addEventListener("click", () => {
        const id = b.getAttribute("data-id");
        if (typeof openEditServiceModal === "function") openEditServiceModal(id);
      });
    });
  } catch (err) {
    container.innerHTML = `<div class="text-danger small py-2 text-center">Failed to load services.</div>`;
  }
}

async function renderPublicProfile(userId) {
  const container = document.getElementById("app-main-content") || document.getElementById("app");
  if (!container) return;

  container.innerHTML = `
    <div class="py-4">
      <div class="text-center py-5 text-secondary small">
        <div class="spinner-border spinner-border-sm text-cyan me-1"></div>Loading public profile...
      </div>
    </div>
  `;

  try {
    const data = await api.get(`users/${userId}/`);
    const user = data.user;
    const services = data.services || [];
    const reviews = data.reviews || [];

    const isOwn = window.currentUser?.id === user.id;

    container.innerHTML = `
      <div class="py-4" style="max-width: 900px; margin: 0 auto;">
        <!-- Back Link -->
        <div class="mb-3">
          <a href="#/marketplace" class="text-secondary text-decoration-none small">
            <i class="bi bi-arrow-left me-1"></i>Back to Marketplace
          </a>
        </div>

        <!-- Hero Card -->
        <div class="glass-panel p-4 mb-4">
          <div class="d-flex align-items-center gap-4 flex-wrap">
            <div class="avatar-large" style="width: 84px; height: 84px; font-size: 2rem;">
              ${getInitials(user.full_name || user.handle)}
            </div>
            <div class="flex-grow-1">
              <div class="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <h3 class="fw-bold text-light mb-0">${esc(user.full_name || user.handle)}</h3>
                <span class="badge bg-cyan text-dark">${esc(user.handle)}</span>
                ${isOwn ? `<a href="#/profile" class="btn btn-sm btn-outline-secondary ms-auto">Edit Profile</a>` : ""}
              </div>
              <p class="text-light-emphasis lead fs-6 mb-2">${esc(user.headline || "Member on Swapski")}</p>
              <div class="d-flex gap-3 text-secondary small flex-wrap">
                ${user.location ? `<span><i class="bi bi-geo-alt me-1"></i>${esc(user.location)}</span>` : ""}
                <span><i class="bi bi-calendar3 me-1"></i>Joined ${formatDate(user.date_joined)}</span>
                <span><i class="bi bi-star-fill text-warning me-1"></i>${user.rating ? `${user.rating} ★ (${user.review_count} reviews)` : "No ratings yet"}</span>
                <span><i class="bi bi-check2-circle text-success me-1"></i>${user.completed_swaps || 0} completed swaps</span>
              </div>
            </div>
          </div>

          ${user.bio ? `
            <div class="pt-3 mt-3 border-top border-dark-subtle">
              <h6 class="text-secondary small text-uppercase fw-semibold mb-2">About</h6>
              <p class="text-secondary small mb-0">${esc(user.bio)}</p>
            </div>
          ` : ""}

          <!-- Skills Badges -->
          <div class="pt-3 mt-3 border-top border-dark-subtle row g-3">
            <div class="col-md-6">
              <h6 class="text-secondary small text-uppercase fw-semibold mb-2">Skills Offered</h6>
              <div>
                ${(user.skills_offered || []).length > 0
                  ? user.skills_offered.map((sk) => `<span class="badge bg-primary-subtle text-primary border border-primary-subtle me-1 mb-1">${esc(sk)}</span>`).join("")
                  : `<span class="text-secondary small">None listed</span>`}
              </div>
            </div>
            <div class="col-md-6">
              <h6 class="text-secondary small text-uppercase fw-semibold mb-2">Skills Wanted</h6>
              <div>
                ${(user.skills_wanted || []).length > 0
                  ? user.skills_wanted.map((sk) => `<span class="badge bg-purple-subtle text-purple border border-purple-subtle me-1 mb-1">${esc(sk)}</span>`).join("")
                  : `<span class="text-secondary small">None listed</span>`}
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <!-- Active Services -->
          <div class="col-lg-7">
            <div class="glass-panel p-4 h-100">
              <h5 class="fw-bold mb-3">Services Offered by ${esc(user.full_name || user.handle)}</h5>
              <div class="d-flex flex-column gap-3">
                ${services.length === 0 ? `
                  <p class="text-secondary small mb-0">No active services currently published by this member.</p>
                ` : services.map((svc) => `
                  <div class="p-3 rounded glass-panel" style="background: rgba(255,255,255,0.03);">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <span class="badge bg-dark-subtle text-light border border-secondary-subtle">${esc(svc.category)}</span>
                      <span class="fw-bold text-cyan fs-5">${svc.credit_cost} <small class="text-secondary fs-6">cr</small></span>
                    </div>
                    <h6 class="fw-bold text-light mb-1">${esc(svc.title)}</h6>
                    <p class="text-secondary small mb-3">${esc(svc.description)}</p>
                    <div class="d-flex justify-content-between align-items-center pt-2 border-top border-dark-subtle">
                      <span class="small text-secondary"><i class="bi bi-clock me-1"></i>${svc.delivery_days} days delivery</span>
                      ${!isOwn ? `
                        <button class="btn btn-sm btn-primary btn-hire-user-svc"
                                data-id="${svc.id}" data-title="${esc(svc.title)}" data-cost="${svc.credit_cost}" data-owner="${esc(user.full_name || user.handle)}">
                          Request Service
                        </button>
                      ` : ""}
                    </div>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

          <!-- Reviews Received -->
          <div class="col-lg-5">
            <div class="glass-panel p-4 h-100">
              <h5 class="fw-bold mb-3">Client Reviews (${reviews.length})</h5>
              <div class="d-flex flex-column gap-3">
                ${reviews.length === 0 ? `
                  <p class="text-secondary small mb-0">No reviews received yet.</p>
                ` : reviews.map((rev) => `
                  <div class="p-3 rounded" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <a href="#/users/${rev.author_id}" class="small fw-semibold text-light text-decoration-none">
                        ${esc(rev.author_name)}
                      </a>
                      <span class="text-warning small">${"★".repeat(rev.score)}</span>
                    </div>
                    ${rev.swap_title ? `<div class="small text-secondary mb-1" style="font-size: 0.72rem;">For: ${esc(rev.swap_title)}</div>` : ""}
                    <p class="small text-secondary mb-1">${esc(rev.text || "No review commentary.")}</p>
                    <span class="text-secondary" style="font-size: 0.7rem;">${formatDate(rev.created_at)}</span>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll(".btn-hire-user-svc").forEach((b) => {
      b.addEventListener("click", () => {
        const svcId = b.getAttribute("data-id");
        const title = b.getAttribute("data-title");
        const cost = parseInt(b.getAttribute("data-cost"), 10);
        const owner = b.getAttribute("data-owner");
        if (typeof openRequestServiceModal === "function") {
          openRequestServiceModal(svcId, title, cost, owner);
        }
      });
    });
  } catch (err) {
    container.innerHTML = `
      <div class="alert alert-danger py-4 text-center my-4">
        <h5>Member Not Found</h5>
        <p class="small mb-3">This profile could not be loaded or the member does not exist.</p>
        <a href="#/marketplace" class="btn btn-outline-light btn-sm">Return to Marketplace</a>
      </div>
    `;
  }
}

window.renderProfile = renderProfile;
window.renderPublicProfile = renderPublicProfile;
