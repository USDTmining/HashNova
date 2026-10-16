/* HashNova API bridge. The UI defaults to a browser-only demo; add ?api=1 to opt into a configured backend. */
window.HashNovaAPI = (() => {
  const params = new URLSearchParams(location.search);
  // Backend mode is opt-in: open with ?api=1 only when a real API server is available.
  const enabled = location.protocol !== 'file:' && params.get('api') === '1';
  const base = '/api';
  async function request(path, options = {}) {
    const res = await fetch(base + path, {
      credentials: 'include',
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
      ...options,
      body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `Request failed (${res.status})`);
    return data;
  }
  return {
    enabled,
    me: () => request('/me'),
    tenantConfig: () => request('/tenant/config'),
    adminOverview: () => request('/admin/overview'),
    adminClients: () => request('/admin/clients'),
    adminWithdrawals: () => request('/admin/withdrawals'),
    adminExposure: () => request('/admin/risk/exposure'),
    adminAccounts: () => request('/admin/accounts'),
    adminAudit: () => request('/admin/audit'),
    adminConnectivity: () => request('/admin/connectivity'),
    adminReconciliationExceptions: () => request('/admin/reconciliation/exceptions'),
    runReconciliation: (connectionId=null, runType='full') => request('/admin/reconciliation/run', {method:'POST', body:{connectionId,runType}}),
    connectivityHeartbeat: (connectionId,status='connected',error=null) => request('/admin/connectivity/heartbeat',{method:'POST',body:{connectionId,status,error}}),
    adminPricing: (assetClass='') => request('/admin/pricing' + (assetClass ? `?assetClass=${encodeURIComponent(assetClass)}` : '')),
    importMT5Specs: (specs, sourceAccount='') => request('/admin/mt5/specs', { method:'POST', body:{ specs, sourceAccount } }),
    reviewWithdrawal: (id, action, note='') => request(`/admin/withdrawals/${id}/${action}`, { method:'POST', body:{note} }),
    login: (email, password) => request('/auth/login', { method:'POST', body:{ email, password } }),
    register: (fullName, email, password) => request('/auth/register', { method:'POST', body:{ fullName, email, password } }),
    logout: () => request('/auth/logout', { method:'POST' }),
    dashboard: () => request('/dashboard/summary'),
    balances: () => request('/wallet/balances'),
    transactions: () => request('/wallet/transactions'),
    withdrawals: () => request('/wallet/withdrawals'),
    kyc: () => request('/kyc'),
    submitKyc: (countryCode, documentType) => request('/kyc', { method:'POST', body:{countryCode,documentType} }),
    depositIntent: (amount, currency='USD', provider='manual') => request('/wallet/deposit-intents', { method:'POST', headers:{'Idempotency-Key': crypto.randomUUID()}, body:{ amount, currency, provider } }),
    withdrawal: (amount, currency, destination) => request('/wallet/withdrawals', { method:'POST', headers:{'Idempotency-Key': crypto.randomUUID()}, body:{ amount, currency, destination } }),
    tradingInstruments: () => request('/trading/instruments'),
    tradingQuotes: () => request('/trading/quotes'),
    tradingAccounts: () => request('/trading/accounts'),
    createTradingAccount: (name, leverage=100, accountType='demo') => request('/trading/accounts', { method:'POST', body:{ name, leverage, accountType } }),
    demoAccount: () => request('/trading/demo-account'),
    reloadDemoFunds: () => request('/trading/demo/reload', { method:'POST' }),
    fundRealAccount: (accountId, amount) => request('/trading/real/fund', { method:'POST', body:{ accountId, amount } }),
    orders: (accountId) => request('/trading/orders' + (accountId ? `?accountId=${encodeURIComponent(accountId)}` : '')),
    positions: (accountId) => request('/trading/positions' + (accountId ? `?accountId=${encodeURIComponent(accountId)}` : '')),
    accountSummary: (accountId) => request(`/trading/account/${accountId}/summary`),
    closePosition: (positionId) => request(`/trading/positions/${positionId}/close`, { method:'POST' }),
    placeOrder: (order) => request('/trading/orders', { method:'POST', headers:{'Idempotency-Key': crypto.randomUUID()}, body:order }),
    tradingEvents: (handlers = {}) => {
      if (!enabled || !window.EventSource) return null;
      const source = new EventSource(base + '/trading/stream', { withCredentials:true });
      Object.entries(handlers).forEach(([event, fn]) => source.addEventListener(event, e => fn(JSON.parse(e.data))));
      return source;
    },
    events: (handlers = {}) => {
      if (!enabled || !window.EventSource) return null;
      const source = new EventSource(base + '/stream/events', { withCredentials:true });
      Object.entries(handlers).forEach(([event, fn]) => source.addEventListener(event, e => fn(JSON.parse(e.data))));
      return source;
    }
  };
})();
