// static/js/pages/wallet.js - Virtual credit wallet & append-only ledger history

async function renderWallet() {
  const container = document.getElementById("app-main-content") || document.getElementById("app");
  if (!container) return;

  container.innerHTML = `
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 class="fw-bold mb-1">Swap Credits Wallet</h2>
          <p class="text-secondary small mb-0">Virtual credit balances and complete append-only ledger history.</p>
        </div>
        <a href="#/marketplace" class="btn btn-primary btn-sm">
          <i class="bi bi-cart me-1"></i>Spend Credits
        </a>
      </div>

      <!-- Informational Explainer Banner -->
      <div class="alert glass-panel py-3 px-4 mb-4 border-info-subtle d-flex align-items-center gap-3">
        <i class="bi bi-info-circle-fill text-cyan fs-3"></i>
        <div class="small text-secondary">
          Swap Credits are virtual platform units. You earn credits by delivering services and spend them to hire others.
          Escrow holds credits safely during ongoing swaps until you approve the delivered work.
        </div>
      </div>

      <!-- Balances Overview -->
      <div class="row g-3 mb-4">
        <div class="col-6 col-md-3">
          <div class="glass-panel p-4 h-100 text-center">
            <div class="text-secondary small mb-1">Available Balance</div>
            <div class="display-6 fw-bold text-cyan" id="wallet-available">0</div>
            <div class="small text-secondary mt-1">Available to spend now</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="glass-panel p-4 h-100 text-center">
            <div class="text-secondary small mb-1">Locked in Escrow</div>
            <div class="display-6 fw-bold text-warning" id="wallet-escrow">0</div>
            <div class="small text-secondary mt-1">Held for active swaps</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="glass-panel p-4 h-100 text-center">
            <div class="text-secondary small mb-1">Total Earned</div>
            <div class="display-6 fw-bold text-success" id="wallet-earned">0</div>
            <div class="small text-secondary mt-1">From completed work</div>
          </div>
        </div>
        <div class="col-6 col-md-3">
          <div class="glass-panel p-4 h-100 text-center">
            <div class="text-secondary small mb-1">Total Spent</div>
            <div class="display-6 fw-bold text-light" id="wallet-spent">0</div>
            <div class="small text-secondary mt-1">On hired services</div>
          </div>
        </div>
      </div>

      <!-- Ledger Transaction History -->
      <div class="glass-panel p-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0">Append-Only Ledger History</h5>
          <span class="text-secondary small">Immutable transaction log</span>
        </div>

        <div class="table-responsive">
          <table class="table table-dark table-hover align-middle mb-0" style="background: transparent;">
            <thead>
              <tr class="text-secondary small border-bottom border-dark-subtle">
                <th>Type</th>
                <th>Description</th>
                <th>Date</th>
                <th class="text-end">Amount</th>
              </tr>
            </thead>
            <tbody id="wallet-ledger-rows">
              <tr>
                <td colspan="4" class="text-center py-4 text-secondary small">
                  <div class="spinner-border spinner-border-sm text-cyan me-1"></div>Loading ledger entries...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  try {
    const data = await api.get("wallet/");
    document.getElementById("wallet-available").textContent = data.balances.available;
    document.getElementById("wallet-escrow").textContent = data.balances.escrow;
    document.getElementById("wallet-earned").textContent = data.balances.earned;
    document.getElementById("wallet-spent").textContent = data.balances.spent;

    const tbody = document.getElementById("wallet-ledger-rows");
    if (!tbody) return;

    if (!data.entries || data.entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-4 text-secondary small">No transactions recorded yet.</td>
        </tr>
      `;
      return;
    }

    const typeBadges = {
      SIGNUP_BONUS: "bg-success-subtle text-success border-success-subtle",
      EARN: "bg-success-subtle text-success border-success-subtle",
      REFUND: "bg-info-subtle text-cyan border-info-subtle",
      ESCROW_LOCK: "bg-warning-subtle text-warning border-warning-subtle",
    };

    tbody.innerHTML = data.entries.map((item) => {
      const badgeCls = typeBadges[item.type] || "bg-secondary-subtle text-secondary";
      const isPositive = item.amount > 0;
      return `
        <tr class="border-bottom border-dark-subtle">
          <td>
            <span class="badge border ${badgeCls}">${item.type.replace("_", " ")}</span>
          </td>
          <td class="text-light small">${esc(item.description)}</td>
          <td class="text-secondary small text-nowrap">${formatDate(item.created_at)}</td>
          <td class="text-end fw-bold ${isPositive ? "text-success" : "text-warning"} text-nowrap">
            ${isPositive ? `+${item.amount}` : item.amount} cr
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    showToast(err.detail || "Failed to load wallet data.", "error");
  }
}

window.renderWallet = renderWallet;
