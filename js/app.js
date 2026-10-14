/* HashNova Cloud Mining Prototype - Simulated Data & Interactions
   ALL BALANCES, HASHRATES, AND TRANSACTIONS ARE DEMO ONLY */

const DEMO = {
  user: {
    name: "Alex Rivera",
    email: "alex.demo@hashnova.io",
    avatar: "AR",
    tier: "Gold Miner",
    joined: "2025-11-12",
    referralCode: "HASH-AR7X9K"
  },
  balances: {
    available: 2847.52,   // USDT (demo)
    pending: 124.80,
    totalEarned: 15620.45,
    btc: 0.04218,
    eth: 1.284
  },
  hashrate: {
    total: 842.5,         // TH/s
    activeMiners: 4,
    efficiency: 98.2
  },
  plans: [
    {
      id: "starter",
      name: "Nova Starter",
      hashrate: 25,
      unit: "TH/s",
      price: 99,
      duration: 180,
      dailyEst: 0.82,
      features: ["25 TH/s SHA-256", "180-day contract", "Daily payouts", "Email support", "Auto-renewal optional"]
    },
    {
      id: "pro",
      name: "Nova Pro",
      hashrate: 100,
      unit: "TH/s",
      price: 349,
      duration: 365,
      dailyEst: 3.45,
      featured: true,
      features: ["100 TH/s SHA-256", "365-day contract", "Daily payouts", "Priority support", "Boost multiplier 1.1×", "Referral bonus +5%"]
    },
    {
      id: "elite",
      name: "Nova Elite",
      hashrate: 500,
      unit: "TH/s",
      price: 1499,
      duration: 730,
      dailyEst: 18.20,
      features: ["500 TH/s SHA-256", "730-day contract", "Hourly payouts", "Dedicated manager", "Boost multiplier 1.25×", "VIP pool access", "Custom reports"]
    },
    {
      id: "titan",
      name: "Nova Titan",
      hashrate: 2000,
      unit: "TH/s",
      price: 4999,
      duration: 1095,
      dailyEst: 78.50,
      features: ["2 PH/s SHA-256", "3-year contract", "Real-time payouts", "White-glove support", "Boost multiplier 1.4×", "Private node option", "API access"]
    }
  ],
  activeContracts: [
    {
      id: "CNT-8821",
      plan: "Nova Pro",
      hashrate: 100,
      start: "2026-03-15",
      end: "2027-03-15",
      status: "active",
      earned: 1240.50,
      progress: 62
    },
    {
      id: "CNT-9104",
      plan: "Nova Starter",
      hashrate: 25,
      start: "2026-06-01",
      end: "2026-11-28",
      status: "active",
      earned: 186.20,
      progress: 38
    },
    {
      id: "CNT-7455",
      plan: "Nova Elite",
      hashrate: 500,
      start: "2025-12-10",
      end: "2027-12-10",
      status: "active",
      earned: 4820.00,
      progress: 45
    },
    {
      id: "CNT-6201",
      plan: "Nova Starter",
      hashrate: 25,
      start: "2025-09-20",
      end: "2026-03-19",
      status: "completed",
      earned: 312.80,
      progress: 100
    }
  ],
  transactions: [
    { id: "TX-99281", type: "mining", amount: 12.45, asset: "USDT", date: "2026-10-14 08:12", status: "completed", note: "Daily mining reward" },
    { id: "TX-99270", type: "mining", amount: 11.98, asset: "USDT", date: "2026-10-13 08:12", status: "completed", note: "Daily mining reward" },
    { id: "TX-99255", type: "withdraw", amount: -500.00, asset: "USDT", date: "2026-10-12 14:33", status: "completed", note: "Withdrawal to external wallet" },
    { id: "TX-99240", type: "mining", amount: 13.02, asset: "USDT", date: "2026-10-12 08:12", status: "completed", note: "Daily mining reward" },
    { id: "TX-99218", type: "deposit", amount: 1000.00, asset: "USDT", date: "2026-10-10 11:05", status: "completed", note: "USDT deposit (TRC-20)" },
    { id: "TX-99190", type: "purchase", amount: -349.00, asset: "USDT", date: "2026-10-08 16:22", status: "completed", note: "Nova Pro contract purchase" },
    { id: "TX-99155", type: "referral", amount: 17.45, asset: "USDT", date: "2026-10-05 09:40", status: "completed", note: "Referral commission" },
    { id: "TX-99120", type: "mining", amount: 10.87, asset: "USDT", date: "2026-10-04 08:12", status: "completed", note: "Daily mining reward" }
  ],
  referrals: {
    total: 14,
    active: 9,
    earnings: 428.60,
    list: [
      { user: "miner_j***", date: "2026-09-28", status: "active", earned: 42.10 },
      { user: "crypto_k***", date: "2026-09-15", status: "active", earned: 68.50 },
      { user: "hash_p***", date: "2026-08-22", status: "active", earned: 112.00 },
      { user: "nova_x***", date: "2026-07-30", status: "inactive", earned: 18.20 }
    ]
  },
  // Simulated live hashrate history (last 24 points)
  hashrateHistory: [780, 795, 810, 805, 820, 835, 840, 838, 845, 850, 848, 842, 855, 860, 858, 845, 840, 838, 842, 848, 850, 845, 842, 842.5]
};

// State
let currentPage = "dashboard";
let isLoggedIn = true; // Start logged in for demo convenience

// DOM helpers
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// Formatters
const fmt = {
  usd: (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  btc: (n) => n.toFixed(5),
  th: (n) => n.toLocaleString("en-US", { maximumFractionDigits: 1 }),
  date: (s) => s
};

// Navigation
function navigate(page) {
  currentPage = page;
  $$(".page").forEach(p => p.classList.remove("active"));
  const target = $(`#page-${page}`);
  if (target) target.classList.add("active");

  $$(".nav-item").forEach(n => {
    n.classList.toggle("active", n.dataset.page === page);
  });

  // Update title
  const titles = {
    dashboard: "Dashboard",
    plans: "Mining Plans",
    miners: "My Contracts",
    wallet: "Wallet",
    referrals: "Referrals",
    profile: "Profile & Settings",
    support: "Support",
    landing: "Welcome",
    login: "Sign In",
    register: "Create Account"
  };
  const titleEl = $("#page-title");
  if (titleEl) titleEl.textContent = titles[page] || "HashNova";

  // Close mobile sidebar
  closeSidebar();

  // Special handling
  if (page === "landing" || page === "login" || page === "register") {
    $(".app-shell")?.classList.add("hidden");
    $("#auth-shell")?.classList.remove("hidden");
  } else {
    $(".app-shell")?.classList.remove("hidden");
    $("#auth-shell")?.classList.add("hidden");
  }

  window.scrollTo(0, 0);
}

// Sidebar mobile
function openSidebar() {
  $(".sidebar")?.classList.add("open");
  $(".sidebar-overlay")?.classList.add("open");
}
function closeSidebar() {
  $(".sidebar")?.classList.remove("open");
  $(".sidebar-overlay")?.classList.remove("open");
}

// Toast
function showToast(message, type = "success") {
  const container = $("#toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${type === "success" ? '<path d="M20 6L9 17l-5-5"/>' : '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>'}
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Modal
function openModal(id) {
  const m = $(`#${id}`);
  if (m) m.classList.add("open");
}
function closeModal(id) {
  const m = $(`#${id}`);
  if (m) m.classList.remove("open");
}

// Simulated purchase
function purchasePlan(planId) {
  const plan = DEMO.plans.find(p => p.id === planId);
  if (!plan) return;
  openModal("modal-purchase");
  $("#purchase-plan-name").textContent = plan.name;
  $("#purchase-hashrate").textContent = `${plan.hashrate} ${plan.unit}`;
  $("#purchase-price").textContent = `$${fmt.usd(plan.price)}`;
  $("#purchase-duration").textContent = `${plan.duration} days`;
  $("#purchase-daily").textContent = `~$${fmt.usd(plan.dailyEst)}`;
  $("#confirm-purchase-btn").onclick = () => {
    closeModal("modal-purchase");
    // Simulate
    if (DEMO.balances.available < plan.price) {
      showToast("Insufficient demo balance. This is a simulation only.", "warning");
      return;
    }
    DEMO.balances.available -= plan.price;
    DEMO.hashrate.total += plan.hashrate;
    DEMO.hashrate.activeMiners += 1;
    DEMO.activeContracts.unshift({
      id: `CNT-${Math.floor(9000 + Math.random() * 999)}`,
      plan: plan.name,
      hashrate: plan.hashrate,
      start: new Date().toISOString().slice(0, 10),
      end: new Date(Date.now() + plan.duration * 86400000).toISOString().slice(0, 10),
      status: "active",
      earned: 0,
      progress: 0
    });
    DEMO.transactions.unshift({
      id: `TX-${Math.floor(99000 + Math.random() * 999)}`,
      type: "purchase",
      amount: -plan.price,
      asset: "USDT",
      date: new Date().toISOString().slice(0, 16).replace("T", " "),
      status: "completed",
      note: `${plan.name} contract purchase`
    });
    updateDashboard();
    renderMiners();
    renderWallet();
    showToast(`Demo purchase successful: ${plan.name} activated! (Simulated)`, "success");
    navigate("miners");
  };
}

// Simulated withdraw
function submitWithdraw() {
  const amount = parseFloat($("#withdraw-amount")?.value);
  const address = $("#withdraw-address")?.value?.trim();
  if (!amount || amount <= 0) {
    showToast("Enter a valid amount", "warning");
    return;
  }
  if (amount > DEMO.balances.available) {
    showToast("Amount exceeds demo available balance", "warning");
    return;
  }
  if (!address || address.length < 10) {
    showToast("Enter a valid wallet address (demo)", "warning");
    return;
  }
  DEMO.balances.available -= amount;
  DEMO.transactions.unshift({
    id: `TX-${Math.floor(99000 + Math.random() * 999)}`,
    type: "withdraw",
    amount: -amount,
    asset: "USDT",
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
    status: "completed",
    note: "Demo withdrawal (simulated)"
  });
  closeModal("modal-withdraw");
  updateDashboard();
  renderWallet();
  showToast(`Demo withdrawal of $${fmt.usd(amount)} processed (simulated)`, "success");
  $("#withdraw-amount").value = "";
  $("#withdraw-address").value = "";
}

// Simulated deposit
function submitDeposit() {
  const amount = parseFloat($("#deposit-amount")?.value);
  if (!amount || amount <= 0) {
    showToast("Enter a valid amount", "warning");
    return;
  }
  DEMO.balances.available += amount;
  DEMO.transactions.unshift({
    id: `TX-${Math.floor(99000 + Math.random() * 999)}`,
    type: "deposit",
    amount: amount,
    asset: "USDT",
    date: new Date().toISOString().slice(0, 16).replace("T", " "),
    status: "completed",
    note: "Demo USDT deposit (simulated)"
  });
  closeModal("modal-deposit");
  updateDashboard();
  renderWallet();
  showToast(`Demo deposit of $${fmt.usd(amount)} credited (simulated)`, "success");
  $("#deposit-amount").value = "";
}

// Live hashrate tick (cosmetic)
function tickHashrate() {
  const variance = (Math.random() - 0.5) * 8;
  DEMO.hashrate.total = Math.max(800, DEMO.hashrate.total + variance * 0.1);
  const el = $("#live-hashrate");
  if (el) el.textContent = `${fmt.th(DEMO.hashrate.total)} TH/s`;
  // Small earnings tick
  const earn = DEMO.hashrate.total * 0.000012;
  DEMO.balances.pending += earn;
  DEMO.balances.totalEarned += earn;
  const pendingEl = $("#pending-balance");
  if (pendingEl) pendingEl.textContent = `$${fmt.usd(DEMO.balances.pending)}`;
}

// Render helpers
function updateDashboard() {
  const set = (id, val) => { const e = $(id); if (e) e.textContent = val; };
  set("#stat-balance", `$${fmt.usd(DEMO.balances.available)}`);
  set("#stat-pending", `$${fmt.usd(DEMO.balances.pending)}`);
  set("#stat-earned", `$${fmt.usd(DEMO.balances.totalEarned)}`);
  set("#live-hashrate", `${fmt.th(DEMO.hashrate.total)} TH/s`);
  set("#stat-miners", DEMO.hashrate.activeMiners);
  set("#stat-efficiency", `${DEMO.hashrate.efficiency}%`);
  set("#wallet-available", `$${fmt.usd(DEMO.balances.available)}`);
  set("#wallet-pending", `$${fmt.usd(DEMO.balances.pending)}`);
  set("#wallet-btc", fmt.btc(DEMO.balances.btc));
  set("#wallet-eth", DEMO.balances.eth.toFixed(3));
}

function renderChart() {
  const container = $("#hashrate-chart");
  if (!container) return;
  const max = Math.max(...DEMO.hashrateHistory);
  container.innerHTML = `<div class="chart-label">Hashrate (24h) — Demo simulation</div>` +
    DEMO.hashrateHistory.map(v => {
      const h = Math.max(4, (v / max) * 100);
      return `<div class="chart-bar" style="height:${h}%" title="${v} TH/s"></div>`;
    }).join("");
}

function renderPlans() {
  const grid = $("#plans-grid");
  if (!grid) return;
  grid.innerHTML = DEMO.plans.map(p => `
    <div class="plan-card ${p.featured ? "featured" : ""}">
      <div class="plan-name">${p.name}</div>
      <div class="text-muted" style="font-size:13px">Cloud SHA-256 Mining</div>
      <div class="plan-hashrate">${p.hashrate} <span style="font-size:16px">${p.unit}</span></div>
      <div class="plan-price">$${fmt.usd(p.price)}</div>
      <ul class="plan-features">
        ${p.features.map(f => `
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>
            ${f}
          </li>
        `).join("")}
      </ul>
      <div class="card-sub mb-16">Est. daily: <span class="text-green">~$${fmt.usd(p.dailyEst)}</span> · ${p.duration} days</div>
      <button class="btn btn-primary w-full" onclick="purchasePlan('${p.id}')">Activate Contract</button>
    </div>
  `).join("");
}

function renderMiners() {
  const list = $("#miners-list");
  if (!list) return;
  list.innerHTML = DEMO.activeContracts.map(c => `
    <div class="miner-card card-glow">
      <div>
        <div class="status-row">
          <span class="badge ${c.status === "active" ? "badge-green" : "badge-gray"}">
            ${c.status === "active" ? '<span class="dot"></span>' : ""} ${c.status}
          </span>
          <span class="mono text-muted" style="font-size:12px">${c.id}</span>
        </div>
        <div style="font-size:17px;font-weight:600;margin-bottom:4px">${c.plan}</div>
        <div class="text-secondary" style="font-size:13px">
          <span class="text-green mono">${c.hashrate} TH/s</span> · ${c.start} → ${c.end}
        </div>
        <div class="mt-16">
          <div class="flex-between" style="font-size:12px;margin-bottom:6px">
            <span class="text-muted">Contract progress</span>
            <span>${c.progress}%</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${c.progress}%"></div></div>
        </div>
      </div>
      <div style="text-align:right">
        <div class="text-muted" style="font-size:12px">Earned</div>
        <div class="mono text-gold" style="font-size:20px;font-weight:700">$${fmt.usd(c.earned)}</div>
      </div>
    </div>
  `).join("");
}

function renderWallet() {
  const tbody = $("#tx-tbody");
  if (!tbody) return;
  tbody.innerHTML = DEMO.transactions.map(t => {
    const isPos = t.amount > 0;
    const typeBadge = {
      mining: "badge-green",
      deposit: "badge-blue",
      withdraw: "badge-gold",
      purchase: "badge-gray",
      referral: "badge-green"
    }[t.type] || "badge-gray";
    return `
      <tr>
        <td class="mono">${t.id}</td>
        <td><span class="badge ${typeBadge}">${t.type}</span></td>
        <td class="mono ${isPos ? "text-green" : "text-gold"}">${isPos ? "+" : ""}${fmt.usd(t.amount)} ${t.asset}</td>
        <td class="text-muted">${t.date}</td>
        <td><span class="badge badge-green">${t.status}</span></td>
        <td class="text-secondary" style="font-size:13px">${t.note}</td>
      </tr>
    `;
  }).join("");
}

function renderReferrals() {
  const tbody = $("#ref-tbody");
  if (!tbody) return;
  tbody.innerHTML = DEMO.referrals.list.map(r => `
    <tr>
      <td>${r.user}</td>
      <td class="text-muted">${r.date}</td>
      <td><span class="badge ${r.status === "active" ? "badge-green" : "badge-gray"}">${r.status}</span></td>
      <td class="mono text-green">$${fmt.usd(r.earned)}</td>
    </tr>
  `).join("");
  const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  set("#ref-total", DEMO.referrals.total);
  set("#ref-active", DEMO.referrals.active);
  set("#ref-earnings", `$${fmt.usd(DEMO.referrals.earnings)}`);
  set("#ref-code", DEMO.user.referralCode);
}

function copyReferral() {
  navigator.clipboard?.writeText(DEMO.user.referralCode).then(() => {
    showToast("Referral code copied (demo)", "success");
  }).catch(() => showToast("Code: " + DEMO.user.referralCode, "info"));
}

// Auth simulation
function doLogin(e) {
  e?.preventDefault();
  isLoggedIn = true;
  showToast("Signed in to demo account", "success");
  navigate("dashboard");
}
function doRegister(e) {
  e?.preventDefault();
  isLoggedIn = true;
  showToast("Demo account created — welcome!", "success");
  navigate("dashboard");
}
function doLogout() {
  isLoggedIn = false;
  showToast("Signed out of demo", "info");
  navigate("landing");
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  // Nav clicks
  $$(".nav-item[data-page]").forEach(btn => {
    btn.addEventListener("click", () => navigate(btn.dataset.page));
  });

  // Render all
  updateDashboard();
  renderChart();
  renderPlans();
  renderMiners();
  renderWallet();
  renderReferrals();

  // Live tick every 4s
  setInterval(tickHashrate, 4000);

  // Start on dashboard
  navigate("dashboard");

  // Close modals on overlay click
  $$(".modal-overlay").forEach(ov => {
    ov.addEventListener("click", (e) => {
      if (e.target === ov) ov.classList.remove("open");
    });
  });
});
