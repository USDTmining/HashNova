/* Edge Nexus Cloud Mining Prototype - Simulated Data & Interactions
   ALL BALANCES, HASHRATES, AND TRANSACTIONS ARE DEMO ONLY */

const DEMO = {
  user: {
    name: "Precision",
    email: "precision@hashnova.io",
    avatar: "P",
    tier: "Premium Plan",
    role: "client",
    joined: "2025-11-12",
    referralCode: "HASH-AR7X9K"
  },
  balances: {
    available: 248.75,   // USDT (demo)
    pending: 12.36,
    totalEarned: 1284.32,
    btc: 0.003682,
    eth: 0.0214
  },
  hashrate: {
    total: 120.5,         // TH/s
    activeMiners: 4,
    efficiency: 97.8
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
    activity: "Account Activity",
    verification: "Identity Verification",
    referrals: "Referrals",
    profile: "Profile & Settings",
    support: "Support",
    admin: "Control Center",
    landing: "Welcome",
    login: "Sign In",
    register: "Create Account"
  };
  const titleEl = $("#page-title");
  if (titleEl) titleEl.textContent = titles[page] || "Edge Nexus";

  // Close mobile sidebar
  closeSidebar();
  if (page === 'trading') setTimeout(loadTradingData, 0);
  if (page === 'admin') setTimeout(loadAdminData, 0);
  if (page === 'activity') setTimeout(loadActivity, 0);
  if (page === 'verification') setTimeout(loadKyc, 0);

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
async function submitWithdraw() {
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
async function submitDeposit() {
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
  const values = [6.6, 6.3, 10.8, 8.4, 12.7, 10.1, 16.7];
  const max = 20, min = 0;
  const w = 720, h = 180, px = 18, py = 12;
  const points = values.map((v,i)=>{
    const x = px + (i/(values.length-1))*(w-px*2);
    const y = h-py-((v-min)/(max-min))*(h-py*2);
    return [x,y];
  });
  const line = points.map(p=>p.join(',')).join(' ');
  const area = `${px},${h-py} ${line} ${w-px},${h-py}`;
  const labels = ['Oct 8','Oct 9','Oct 10','Oct 11','Oct 12','Oct 13','Oct 14'];
  container.innerHTML = `<svg viewBox="0 0 ${w} ${h+26}" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="earnFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13e995" stop-opacity=".34"/><stop offset="1" stop-color="#13e995" stop-opacity="0"/></linearGradient></defs>
    <polygon points="${area}" fill="url(#earnFill)"/>
    <polyline points="${line}" fill="none" stroke="#16ef9a" stroke-width="3" vector-effect="non-scaling-stroke"/>
    ${points.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4" fill="#e9fff7" stroke="#16ef9a" stroke-width="2" vector-effect="non-scaling-stroke"/>`).join('')}
    ${labels.map((t,i)=>{const x=px+(i/(labels.length-1))*(w-px*2);return `<text x="${x}" y="${h+17}" text-anchor="middle" fill="#71889b" font-size="9">${t}</text>`}).join('')}
    ${[0,5,10,15,20].map(v=>{const y=h-py-(v/max)*(h-py*2);return `<text x="0" y="${y+3}" fill="#71889b" font-size="9">$${v}</text>`}).join('')}
  </svg>`;
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


async function loadActivity(){
  if (!window.HashNexusAPI && !window.HashNovaAPI?.enabled) return;
  try {
    const [tx, orders] = await Promise.all([HashNovaAPI.transactions(), HashNovaAPI.orders()]);
    const wb = $("#activity-wallet-body");
    const ob = $("#activity-orders-body");
    if (wb) wb.innerHTML = (tx.transactions || []).map(t => `<tr><td><span class="badge badge-gray">${t.type}</span></td><td class="mono ${t.direction==='credit'?'text-green':'text-gold'}">${t.direction==='credit'?'+':'-'}${fmt.usd(Number(t.amount))} ${t.currency}</td><td>${t.status}</td><td class="mono">${t.external_ref || '—'}</td><td class="text-muted">${new Date(t.created_at).toLocaleString()}</td></tr>`).join('') || `<tr><td colspan="5" class="text-muted">No wallet activity yet.</td></tr>`;
    if (ob) ob.innerHTML = (orders.orders || []).map(o => `<tr><td class="mono">${o.symbol}</td><td>${o.side}</td><td>${o.quantity}</td><td>${o.status}</td><td class="text-muted">${new Date(o.created_at || o.executed_at).toLocaleString()}</td></tr>`).join('') || `<tr><td colspan="5" class="text-muted">No trading orders yet.</td></tr>`;
  } catch(e) { showToast(e.message || 'Could not load activity','error'); }
}

async function loadKyc(){
  if (!HashNovaAPI?.enabled) return;
  try {
    const r = await HashNovaAPI.kyc(); const k=r.kyc||{};
    const title=$("#kyc-status-title"), copy=$("#kyc-status-copy"), submit=$("#kyc-submit");
    const labels={not_started:['Not started','Your verification profile has not been submitted.'],pending:['Under review','Your verification request has been submitted for review.'],verified:['Verified','Identity verification is complete for this account.'],rejected:['Action required','Your verification was not approved. Review the note from compliance.'],expired:['Expired','Your verification needs to be renewed.']};
    const v=labels[k.status]||labels.not_started; if(title) title.textContent=v[0]; if(copy) copy.textContent=v[1];
    if($("#kyc-country") && k.country_code) $("#kyc-country").value=k.country_code; if($("#kyc-document") && k.document_type) $("#kyc-document").value=k.document_type;
    if(submit) { submit.disabled = k.status==='pending' || k.status==='verified'; submit.textContent = k.status==='verified'?'Verified':k.status==='pending'?'Submitted — awaiting review':'Start verification'; }
  } catch(e) {}
}

async function submitKyc(){
  try { const r=await HashNovaAPI.submitKyc($("#kyc-country").value,$("#kyc-document").value); showToast('Verification request submitted','success'); loadKyc(); } catch(e){ showToast(e.message||'Could not submit verification','error'); }
}

// Authentication + backend synchronization
async function syncFromApi() {
  if (!window.HashNovaAPI?.enabled) return false;
  try {
    const me = await HashNovaAPI.me();
    isLoggedIn = true;
    DEMO.user.name = me.user.fullName || DEMO.user.name;
    DEMO.user.email = me.user.email || DEMO.user.email;
    DEMO.user.role = me.user.role || "client";
    updateAdminNav();
    DEMO.user.avatar = (DEMO.user.name || 'U').slice(0, 1).toUpperCase();
    const dash = await HashNovaAPI.dashboard();
    const account = dash.accounts?.find(a => a.currency === 'USD') || dash.accounts?.[0];
    if (account) {
      DEMO.balances.available = Number(account.available_balance || 0);
      DEMO.balances.pending = Math.max(0, Number(account.balance || 0) - Number(account.available_balance || 0));
      DEMO.balances.totalEarned = Number(account.total_credits || 0);
    }
    const tx = await HashNovaAPI.transactions();
    if (Array.isArray(tx.transactions) && tx.transactions.length) {
      DEMO.transactions = tx.transactions.map(t => ({
        id: t.id, type: t.type, amount: t.direction === 'debit' ? -Number(t.amount) : Number(t.amount),
        asset: t.currency, date: t.created_at, status: t.status, note: t.metadata?.note || t.type
      }));
    }
    updateDashboard(); renderWallet();
    return true;
  } catch (err) {
    isLoggedIn = false;
    return false;
  }
}

function updateAdminNav(){
  const isAdmin=['admin','support','finance'].includes(DEMO.user.role);
  $$('.admin-nav-item').forEach(el=>el.style.display=isAdmin?'flex':'none');
  $$('.admin-nav-label').forEach(el=>el.style.display=isAdmin?'block':'none');
}
function fmtAdminDate(v){try{return new Date(v).toLocaleString('en-US',{dateStyle:'short',timeStyle:'short'});}catch{return v||'—';}}
async function loadAdminData(){
  if(!window.HashNovaAPI?.enabled) return showToast('Run through the backend server to use Control Center.','info');
  if(!['admin','support','finance'].includes(DEMO.user.role)) return showToast('Operations access required.','error');
  try{
    const [o,w,e,a,au,c,pricing,conn,exceptions]=await Promise.all([HashNovaAPI.adminOverview(),HashNovaAPI.adminWithdrawals(),HashNovaAPI.adminExposure(),HashNovaAPI.adminAccounts(),HashNovaAPI.adminAudit(),HashNovaAPI.adminClients(),HashNovaAPI.adminPricing(),HashNovaAPI.adminConnectivity(),HashNovaAPI.adminReconciliationExceptions()]);
    const set=(id,v)=>{const el=$(id);if(el)el.textContent=v};
    set('#admin-clients',o.clients?.count??0); set('#admin-equity',money(o.accounts?.equity)); set('#admin-withdrawals',`${o.withdrawals?.count??0} · ${money(o.withdrawals?.amount)}`); set('#admin-volume',money(o.volume24h?.notional));
    const catalog=pricing.instruments||[]; set('#mt5-instrument-count',catalog.length); set('#mt5-forex-count',catalog.filter(x=>x.asset_class==='forex').length); set('#mt5-other-count',catalog.filter(x=>x.asset_class!=='forex').length);
    const risk=$('#admin-risk-list'); if(risk) risk.innerHTML=(o.risk||[]).map(r=>`<div class="admin-risk-row"><span>${r.risk_state.replace('_',' ')}</span><strong>${r.count}</strong></div>`).join('')||'<div class="empty-state">No accounts yet.</div>';
    const eb=$('#admin-exposure-body'); if(eb) eb.innerHTML=(e.exposure||[]).map(x=>`<tr><td><strong>${x.symbol}</strong></td><td>${x.side}</td><td>${x.positions}</td><td>${Number(x.lots).toFixed(2)}</td><td class="${Number(x.unrealized_pnl)>=0?'text-green':'text-red'}">${money(x.unrealized_pnl)}</td></tr>`).join('')||'<tr><td colspan="5" class="empty-state">No open exposure.</td></tr>';
    const wb=$('#admin-withdrawal-body'); if(wb) wb.innerHTML=(w.withdrawals||[]).map(x=>`<tr><td><strong>${x.full_name}</strong><small>${x.email}</small></td><td>${money(x.amount)} ${x.currency}</td><td>${x.kyc_status}</td><td>${x.status}</td><td>${fmtAdminDate(x.created_at)}</td><td>${x.status==='pending'?`<button class="btn btn-buy btn-sm" onclick="reviewAdminWithdrawal('${x.id}','approve')">Approve</button> <button class="btn btn-sell btn-sm" onclick="reviewAdminWithdrawal('${x.id}','reject')">Reject</button>`:'—'}</td></tr>`).join('')||'<tr><td colspan="6" class="empty-state">No withdrawals.</td></tr>';
    const ab=$('#admin-accounts-body'); if(ab) ab.innerHTML=(a.accounts||[]).map(x=>`<tr><td><strong>${x.account_number}</strong><small>1:${x.leverage}</small></td><td>${x.full_name}<small>${x.email}</small></td><td>${money(x.equity)}</td><td>${money(x.margin_used)}</td><td>${Number(x.margin_level||0).toFixed(1)}%</td><td><span class="badge ${x.risk_state==='normal'?'badge-green':x.risk_state==='margin_call'?'badge-gold':'badge-red'}">${x.risk_state}</span></td></tr>`).join('')||'<tr><td colspan="6" class="empty-state">No trading accounts.</td></tr>';
    const connections=conn.connections||[]; const mt5c=connections.find(x=>x.provider==='mt5'); set('#mt5-connection-status',mt5c?.status||'disconnected'); set('#mt5-heartbeat',mt5c?.last_heartbeat_at?fmtAdminDate(mt5c.last_heartbeat_at):'—'); set('#recon-exceptions',(exceptions.exceptions||[]).length);
    const cb=$('#admin-connectivity-body'); if(cb) cb.innerHTML=connections.map(x=>`<tr><td><strong>${escapeHtml(x.name)}</strong></td><td>${x.provider.toUpperCase()}</td><td>${x.environment}</td><td><span class="badge ${x.status==='connected'?'badge-green':x.status==='error'?'badge-red':'badge-gold'}">${x.status}</span></td><td>${x.last_sync_at?fmtAdminDate(x.last_sync_at):'—'}</td></tr>`).join('')||'<tr><td colspan="5" class="empty-state">No broker connections configured.</td></tr>';
    const auB=$('#admin-audit-body'); if(auB) auB.innerHTML=(au.events||[]).slice(0,50).map(x=>`<tr><td>${fmtAdminDate(x.created_at)}</td><td>${x.email||'system'}</td><td>${x.event_type}</td><td><code>${escapeHtml(JSON.stringify(x.payload||{}))}</code></td></tr>`).join('')||'<tr><td colspan="4" class="empty-state">No audit events.</td></tr>';
  }catch(e){showToast(e.message,'error');}
}
function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
async function reviewAdminWithdrawal(id,action){ const note=action==='reject'?prompt('Reason for rejection?')||'Rejected by operations':'Approved by operations'; try{await HashNovaAPI.reviewWithdrawal(id,action,note);showToast(`Withdrawal ${action}d`,'success');await loadAdminData();}catch(e){showToast(e.message,'error');} }
async function runAdminReconciliation(){try{const r=await HashNovaAPI.runReconciliation();showToast(`Reconciliation ${r.run?.status||'started'}`,'success');await loadAdminData();}catch(e){showToast(e.message,'error');}}

async function doLogin(e) {
  e?.preventDefault();
  const form = e?.target;
  const inputs = form ? [...form.querySelectorAll('input')] : [];
  const email = inputs.find(i => i.type === 'email')?.value || '';
  const password = inputs.find(i => i.type === 'password')?.value || '';
  if (window.HashNovaAPI?.enabled) {
    try { await HashNovaAPI.login(email, password); isLoggedIn = true; await syncFromApi(); showToast('Signed in securely', 'success'); navigate('dashboard'); }
    catch (err) { showToast(err.message, 'error'); }
    return;
  }
  isLoggedIn = true; showToast('Signed in to demo account', 'success'); navigate('dashboard');
}
async function doRegister(e) {
  e?.preventDefault();
  const form = e?.target;
  const inputs = form ? [...form.querySelectorAll('input')] : [];
  const fullName = inputs.find(i => i.type === 'text')?.value || '';
  const email = inputs.find(i => i.type === 'email')?.value || '';
  const password = inputs.find(i => i.type === 'password')?.value || '';
  if (window.HashNovaAPI?.enabled) {
    try { await HashNovaAPI.register(fullName, email, password); isLoggedIn = true; await syncFromApi(); showToast('Account created securely', 'success'); navigate('dashboard'); }
    catch (err) { showToast(err.message, 'error'); }
    return;
  }
  isLoggedIn = true; showToast('Demo account created — welcome!', 'success'); navigate('dashboard');
}
async function doLogout() {
  if (window.HashNovaAPI?.enabled) { try { await HashNovaAPI.logout(); } catch {} }
  isLoggedIn = false; showToast(window.HashNovaAPI?.enabled ? 'Signed out securely' : 'Signed out of demo', 'info'); navigate('landing');
}

// Init
document.addEventListener("DOMContentLoaded", async () => {
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
  renderTradingTerminal();
  updateAdminNav();

  // Live tick every 4s
  setInterval(tickHashrate, 4000);

  // Start on dashboard, then replace demo state with server state when API mode is active.
  navigate("dashboard");
  if (window.HashNovaAPI?.enabled) {
    const authenticated = await syncFromApi();
    if (!authenticated) navigate("landing");
    const events = HashNovaAPI.events({
      'withdrawal.updated': () => { HashNovaAPI.transactions().then(({transactions}) => { DEMO.transactions = transactions.map(t => ({ id:t.id, type:t.type, amount:t.direction==='debit'?-Number(t.amount):Number(t.amount), asset:t.currency, date:t.created_at, status:t.status, note:t.metadata?.note || t.type })); renderWallet(); }); },
      'heartbeat': () => {},
      'risk.updated': () => { if(currentPage==='trading') loadTradingData(); },
      'position.closed': () => { if(currentPage==='trading') loadTradingData(); }
    });
    window.hashNovaEventStream = events;
  }

  // Close modals on overlay click
  $$(".modal-overlay").forEach(ov => {
    ov.addEventListener("click", (e) => {
      if (e.target === ov) ov.classList.remove("open");
    });
  });
});

// ===== Forex trading terminal =====
let tradingState = { accounts: [], instruments: [], quotes: [], selectedAccount: null, selectedSymbol: 'EURUSD', assetClass: '', timeframe: '1H', watchlist: JSON.parse(localStorage.getItem('edgeNexusWatchlist') || 'null') || ['EURUSD','GBPUSD','XAUUSD','US30'] };
let tradingQuoteTimer = null;
function money(n){ return `$${Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`; }
async function loadTradingData(){
  if (!window.HashNovaAPI?.enabled) { showToast('Open the app through the backend server to use Trading Terminal.','info'); return; }
  try {
    const [a,i,q] = await Promise.all([HashNovaAPI.tradingAccounts(), HashNovaAPI.tradingInstruments(), HashNovaAPI.tradingQuotes()]);
    tradingState.accounts=a.accounts||[]; tradingState.instruments=i.instruments||[]; tradingState.quotes=q.quotes||[];
    if (!tradingState.selectedAccount) tradingState.selectedAccount=tradingState.accounts[0]?.id;
    renderTradingTerminal();
    if(!tradingQuoteTimer){ tradingQuoteTimer=setInterval(async()=>{ if(currentPage!=='trading') return; try{ const q=await HashNovaAPI.tradingQuotes(); tradingState.quotes=q.quotes||[]; renderTradingTerminal(); }catch(e){} }, 4000); }
    if (tradingState.selectedAccount) {
      const [p,s]=await Promise.all([HashNovaAPI.positions(tradingState.selectedAccount),HashNovaAPI.accountSummary(tradingState.selectedAccount)]);
      renderPositions(p.positions||[]); renderAccountHealth(s.summary);
    }
  } catch(e){ showToast(e.message,'error'); }
}
function renderTradingTerminal(){
  const accountSelect=$('#trading-account-select');
  if(accountSelect){ accountSelect.innerHTML=tradingState.accounts.map(a=>`<option value="${a.id}" ${a.id===tradingState.selectedAccount?'selected':''}>${a.account_number} · ${a.account_type==='demo'?'Demo':'Real'} · 1:${a.leverage}</option>`).join(''); accountSelect.onchange=()=>{tradingState.selectedAccount=accountSelect.value;loadTradingData();}; }
  const filter=$('#instrument-class-filter');
  if(filter){ filter.value=tradingState.assetClass; filter.onchange=()=>{tradingState.assetClass=filter.value;renderTradingTerminal();}; }
  const visibleInstruments=tradingState.instruments.filter(i=>!tradingState.assetClass||i.asset_class===tradingState.assetClass);
  const orderSymbol=$('#order-symbol');
  if(orderSymbol){ orderSymbol.innerHTML=visibleInstruments.map(i=>`<option value="${i.symbol}" ${i.symbol===tradingState.selectedSymbol?'selected':''}>${i.symbol}</option>`).join(''); orderSymbol.onchange=()=>{tradingState.selectedSymbol=orderSymbol.value;renderTradingTerminal();}; }
  const grid=$('#market-grid'); if(grid){ grid.innerHTML=visibleInstruments.map(i=>{const q=tradingState.quotes.find(x=>x.symbol===i.symbol);const active=i.symbol===tradingState.selectedSymbol;const digits=Number(i.digits??5);return `<div class="market-tile ${active?'active':''}" onclick="tradingState.selectedSymbol='${i.symbol}';renderTradingTerminal()"><small>${i.symbol}</small><strong>${q?Number(q.bid).toFixed(digits):'—'}</strong><em>${q?`spread ${(Number(q.ask)-Number(q.bid)).toFixed(digits)}`:'Broker feed pending'}</em></div>`}).join(''); }
  renderWatchlist();
  renderPriceChart();
  const q=tradingState.quotes.find(x=>x.symbol===tradingState.selectedSymbol); const instrument=tradingState.instruments.find(x=>x.symbol===tradingState.selectedSymbol); const account=tradingState.accounts.find(a=>a.id===tradingState.selectedAccount); const qty=Number($('#order-quantity')?.value||0.1); if(q&&instrument&&account){const margin=qty*Number(instrument.contract_size)*Number(q.ask)/Number(account.leverage); const digits=Number(instrument.digits??5); const set=(id,v)=>{const el=$(id);if(el)el.textContent=v}; set('#buy-price',Number(q.ask).toFixed(digits));set('#sell-price',Number(q.bid).toFixed(digits));set('#order-margin',money(margin));set('#order-leverage',`1:${account.leverage}`);set('#trading-selected-symbol',q.symbol); } else { const set=(id,v)=>{const el=$(id);if(el)el.textContent=v}; set('#buy-price','—');set('#sell-price','—');set('#order-margin','—');set('#trading-selected-symbol',tradingState.selectedSymbol); }
}
function renderPositions(positions){
  const body=$('#positions-body'); if(!body)return; if(!positions.length){body.innerHTML='<tr><td colspan="7" class="empty-state">No open positions.</td></tr>';return;}
  body.innerHTML=positions.map(p=>`<tr><td><strong>${p.symbol}</strong></td><td><span class="badge ${p.side==='long'?'badge-green':'badge-red'}">${p.side}</span></td><td>${Number(p.quantity).toFixed(2)}</td><td>${Number(p.entry_price).toFixed(p.symbol==='USDJPY'?3:p.symbol==='XAUUSD'?2:5)}</td><td>${Number(p.markPrice).toFixed(p.symbol==='USDJPY'?3:p.symbol==='XAUUSD'?2:5)}</td><td class="${Number(p.unrealizedPnl)>=0?'text-green':'text-red'}">${money(p.unrealizedPnl)}</td><td><button class="btn btn-outline btn-sm" onclick="closeTradingPosition('${p.id}')">Close</button></td></tr>`).join('');
}
function renderAccountHealth(summary){ if(!summary)return; const set=(id,v)=>{const el=$(id);if(el)el.textContent=v};set('#trade-balance',money(summary.balance));set('#trade-equity',money(summary.equity));set('#trade-margin',money(summary.margin_used));set('#trade-free-margin',money(summary.margin_available ?? summary.marginAvailable));set('#trade-margin-level',summary.margin_level>0?`${Number(summary.margin_level).toFixed(1)}%`:'—');set('#trade-risk-state',String(summary.risk_state||'normal').replace('_',' ')); }
function saveWatchlist(){ localStorage.setItem('edgeNexusWatchlist', JSON.stringify(tradingState.watchlist)); }
function toggleWatch(symbol){ const i=tradingState.watchlist.indexOf(symbol); if(i>=0) tradingState.watchlist.splice(i,1); else tradingState.watchlist.push(symbol); saveWatchlist(); renderWatchlist(); }
function renderWatchlist(){ const el=$('#watchlist-strip'); if(!el) return; const symbols=tradingState.watchlist.filter(s=>tradingState.instruments.some(i=>i.symbol===s)); el.innerHTML=symbols.map(s=>{const q=tradingState.quotes.find(x=>x.symbol===s); const active=s===tradingState.selectedSymbol; return `<button class="watch-item ${active?'active':''}" onclick="tradingState.selectedSymbol='${s}';renderTradingTerminal()">${s} ${q?Number(q.bid).toFixed(Number(tradingState.instruments.find(i=>i.symbol===s)?.digits??5)):'—'}</button>`}).join('') + `<button class="watch-star" title="Add selected symbol to watchlist" onclick="toggleWatch('${tradingState.selectedSymbol}')">${tradingState.watchlist.includes(tradingState.selectedSymbol)?'★':'☆'}</button>`; }
function setChartTimeframe(tf){ tradingState.timeframe=tf; $$('.chart-time').forEach(b=>b.classList.toggle('active', b.dataset.timeframe===tf)); renderPriceChart(); }
function renderPriceChart(){
  const el=$('#quote-chart'); if(!el) return;
  const inst=tradingState.instruments.find(i=>i.symbol===tradingState.selectedSymbol); const q=tradingState.quotes.find(x=>x.symbol===tradingState.selectedSymbol);
  const digits=Number(inst?.digits??5); const price=Number(q?.bid||0); const spread=Math.abs(Number(q?.ask||0)-price);
  $('#chart-symbol-label') && ($('#chart-symbol-label').textContent=tradingState.selectedSymbol); $('#chart-price-label') && ($('#chart-price-label').textContent=price?price.toFixed(digits):'—');
  const seed=price||100; const count=tradingState.timeframe==='1W'?56:tradingState.timeframe==='1D'?40:tradingState.timeframe==='4H'?32:24;
  const values=Array.from({length:count},(_,i)=>seed*(1 + Math.sin(i*.72 + tradingState.selectedSymbol.length)*.0015 + Math.sin(i*.19)*.001 + (i/count)*.0008));
  if(price) values[values.length-1]=price;
  const min=Math.min(...values), max=Math.max(...values), pad=(max-min||seed*.001)*.18; const lo=min-pad, hi=max+pad;
  const w=1000,h=360; const pts=values.map((v,i)=>`${(i/(values.length-1))*w},${h-((v-lo)/(hi-lo))*h}`).join(' ');
  const area=`0,${h} ${pts} ${w},${h}`;
  el.innerHTML=`<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="${tradingState.selectedSymbol} ${tradingState.timeframe} price chart"><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".16"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><g stroke="currentColor" opacity=".09"><path d="M0 72H1000M0 144H1000M0 216H1000M0 288H1000"/><path d="M125 0V360M250 0V360M375 0V360M500 0V360M625 0V360M750 0V360M875 0V360"/></g><polygon points="${area}" fill="url(#chartFill)"/><polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="4" vector-effect="non-scaling-stroke"/></svg>`;
  $('#chart-high') && ($('#chart-high').textContent=`High ${hi.toFixed(digits)}`); $('#chart-low') && ($('#chart-low').textContent=`Low ${lo.toFixed(digits)}`); $('#chart-spread') && ($('#chart-spread').textContent=`Spread ${spread?spread.toFixed(digits):'—'}`);
}
function openRealFunding(){ const a=tradingState.accounts.find(x=>x.id===tradingState.selectedAccount); if(!a) return showToast('Select a trading account first','error'); if(a.account_type!=='real') return showToast('Select a real trading account to fund it','info'); const label=$('#real-funding-account-label'); if(label) label.textContent=`Selected account: ${a.account_number} · Real`; openModal('modal-real-funding'); }
async function fundSelectedRealAccount(){ const a=tradingState.accounts.find(x=>x.id===tradingState.selectedAccount); const amount=Number($('#real-funding-amount')?.value); if(!a||a.account_type!=='real') return showToast('Select a real trading account','error'); if(!amount||amount<=0) return showToast('Enter a valid amount','error'); try{ const r=await HashNovaAPI.fundRealAccount(a.id,amount); closeModal('modal-real-funding'); showToast(`${money(amount)} transferred from wallet to real account`,'success'); await loadTradingData(); }catch(e){ showToast(e.message,'error'); } }
async function reloadDemoFunds(){ try{const result=await HashNovaAPI.reloadDemoFunds();showToast('Demo account reloaded to $10,000','success');await loadTradingData();}catch(e){showToast(e.message,'error');} }
async function closeTradingPosition(id){ try{const result=await HashNovaAPI.closePosition(id);showToast(`Position closed · ${money(result.pnl)} P&L`,'success');await loadTradingData();}catch(e){showToast(e.message,'error');} }
async function placeTrade(side){
  if(!tradingState.selectedAccount)return showToast('No trading account selected','error');
  const symbol=tradingState.selectedSymbol; const quantity=Number($('#order-quantity')?.value); if(!quantity||quantity<=0)return showToast('Enter a valid lot size','error');
  try{const result=await HashNovaAPI.placeOrder({accountId:tradingState.selectedAccount,symbol,side,quantity,orderType:'market'});showToast(`${side.toUpperCase()} ${symbol} ${quantity.toFixed(2)} lots executed at ${Number(result.execution.price).toFixed(5)}`,'success');await loadTradingData();}catch(e){showToast(e.message,'error');}
}
