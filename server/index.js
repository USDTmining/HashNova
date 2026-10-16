import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { URL } from 'node:url';
import { Pool } from 'pg';
import { DemoMarketAdapter } from './market-adapter.js';
import { MT5Adapter } from './mt5-adapter.js';
import { ExecutionGateway } from './execution-gateway.js';

const PORT = Number(process.env.PORT || 8080);
const APP_ORIGIN = process.env.APP_ORIGIN || `http://localhost:${PORT}`;
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-me';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'dev-only-webhook-secret';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const streams = new Map();
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const market = new DemoMarketAdapter(pool);
const mt5 = new MT5Adapter(pool);
const execution = new ExecutionGateway({ mt5 });
const tradingStreams = new Map();

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
};
const ok = (res, body = {}) => json(res, 200, body);
const bad = (res, status, message, details) => json(res, status, { error: { message, ...(details ? { details } : {}) } });

function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(v => {
    const i = v.indexOf('='); return [v.slice(0, i).trim(), decodeURIComponent(v.slice(i + 1))];
  }));
}
function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function sign(value) { return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex'); }
function timingSafe(a, b) { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && crypto.timingSafeEqual(aa, bb); }
async function readRawBody(req) { let data = ''; for await (const chunk of req) data += chunk; return data; }
async function readBody(req) { const data = await readRawBody(req); if (!data) return {}; try { return JSON.parse(data); } catch { throw new Error('Invalid JSON'); } }
function passwordHash(password, salt = crypto.randomBytes(16).toString('hex')) {
  return new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (err, derived) => err ? reject(err) : resolve(`scrypt:${salt}:${derived.toString('hex')}`)));
}
function verifyPassword(password, encoded) {
  return new Promise((resolve, reject) => {
    const [, salt, expected] = String(encoded).split(':');
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) return reject(err);
      resolve(timingSafe(derived.toString('hex'), expected));
    });
  });
}
async function authenticate(req) {
  const token = parseCookies(req).session;
  if (!token) return null;
  const dot = token.indexOf('.'); if (dot < 1) return null;
  const raw = token.slice(0, dot), sig = token.slice(dot + 1);
  if (!timingSafe(sign(raw), sig)) return null;
  const [sessionId, expires] = Buffer.from(raw, 'base64url').toString().split(':');
  if (!sessionId || Number(expires) < Date.now()) return null;
  const { rows } = await pool.query(`SELECT s.id, s.user_id, u.email, u.full_name, u.role, u.status FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 AND s.expires_at > now() AND u.status='active'`, [sessionId]);
  return rows[0] || null;
}
async function createSession(userId) {
  const sessionId = crypto.randomUUID();
  const expires = Date.now() + 1000 * 60 * 60 * 24 * 30;
  const raw = Buffer.from(`${sessionId}:${expires}`).toString('base64url');
  const token = `${raw}.${sign(raw)}`;
  await pool.query(`INSERT INTO sessions(id,user_id,token_hash,expires_at) VALUES($1,$2,$3,to_timestamp($4/1000.0))`, [sessionId, userId, hash(token), new Date(expires)]);
  return token;
}
async function audit(userId, type, req, payload = {}) {
  await pool.query(`INSERT INTO audit_events(user_id,event_type,ip_address,user_agent,payload) VALUES($1,$2,$3,$4,$5)`, [userId || null, type, req.socket.remoteAddress || null, req.headers['user-agent'] || null, payload]);
}
function emit(userId, event, data) {
  for (const client of streams.get(userId) || []) client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  for (const client of tradingStreams.get(userId) || []) client.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function accountNumber() { return `EN-${Math.floor(10000000 + Math.random() * 89999999)}`; }
async function ensureTradingAccount(userId) {
  const existing = await pool.query(`SELECT * FROM trading_accounts WHERE user_id=$1 ORDER BY account_type,created_at LIMIT 1`, [userId]);
  if (existing.rows[0]) return existing.rows[0];
  const { rows } = await pool.query(`INSERT INTO trading_accounts(user_id,account_number,risk_profile_id,account_type,balance,equity) VALUES($1,$2,(SELECT rp.id FROM risk_profiles rp JOIN users u ON u.tenant_id=rp.tenant_id WHERE u.id=$1 AND rp.name='Standard' LIMIT 1),'demo',10000,10000) RETURNING *`, [userId, accountNumber()]);
  return rows[0];
}
async function accountSummary(accountId) { return recalcTradingAccount(accountId); }
function requireRole(user, roles) {
  if (!roles.includes(user.role)) throw Object.assign(new Error('Insufficient privileges'), { status: 403 });
}
async function riskProfileForAccount(accountId) {
  return (await pool.query(`SELECT rp.* FROM risk_profiles rp JOIN trading_accounts ta ON ta.risk_profile_id=rp.id WHERE ta.id=$1`, [accountId])).rows[0] || null;
}
function positionPnl(position, quote, contractSize) {
  const mark = position.side === 'long' ? Number(quote.bid) : Number(quote.ask);
  const diff = position.side === 'long' ? mark - Number(position.entry_price) : Number(position.entry_price) - mark;
  return diff * Number(position.quantity) * Number(contractSize);
}
async function recalcTradingAccount(accountId) {
  const account = (await pool.query(`SELECT * FROM trading_accounts WHERE id=$1`, [accountId])).rows[0];
  if (!account) return null;
  const positions = (await pool.query(`SELECT p.*,i.contract_size,q.bid,q.ask FROM positions p JOIN instruments i ON i.symbol=p.symbol JOIN market_quotes q ON q.symbol=p.symbol WHERE p.trading_account_id=$1 AND p.status='open'`, [accountId])).rows;
  let unrealized = 0, marginUsed = 0;
  for (const p of positions) { unrealized += positionPnl(p, p, p.contract_size); marginUsed += Number(p.quantity) * Number(p.contract_size) * (p.side === 'long' ? Number(p.ask) : Number(p.bid)) / Number(account.leverage); }
  const balance = Number(account.balance);
  const equity = balance + unrealized;
  const free = Math.max(0, equity - marginUsed);
  const marginLevel = marginUsed > 0 ? (equity / marginUsed) * 100 : 0;
  const profile = await riskProfileForAccount(accountId);
  let riskState = 'normal';
  if (equity <= 0 || (profile && marginUsed > 0 && marginLevel <= Number(profile.stop_out_pct))) riskState = 'stop_out';
  else if (profile && marginUsed > 0 && marginLevel <= Number(profile.margin_call_pct)) riskState = 'margin_call';
  await pool.query(`UPDATE trading_accounts SET equity=$1,margin_used=$2,margin_available=$3,margin_level=$4,risk_state=$5,updated_at=now() WHERE id=$6`, [equity,marginUsed,free,marginLevel,riskState,accountId]);
  return {...account,balance,equity,margin_used:marginUsed,margin_available:free,margin_level:marginLevel,risk_state:riskState,unrealizedPnl:unrealized};
}
async function riskSweep() {
  try { const ids=(await pool.query(`SELECT id FROM trading_accounts WHERE status='active'`)).rows; for(const row of ids){ const summary=await recalcTradingAccount(row.id); if(summary?.user_id) emit(summary.user_id,'risk.updated',summary); } } catch(e){ console.error('risk sweep',e.message); }
}
function requireIdempotency(req) {
  const key = req.headers['idempotency-key'];
  if (!key || String(key).length < 8 || String(key).length > 128) throw Object.assign(new Error('Idempotency-Key header is required'), { status: 400 });
  return String(key);
}

async function route(req, res) {
  const url = new URL(req.url, APP_ORIGIN);
  const path = url.pathname;
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': APP_ORIGIN, 'access-control-allow-credentials': 'true', 'access-control-allow-headers': 'Content-Type, Idempotency-Key' }); return res.end(); }
  if (path === '/api/health' && req.method === 'GET') return ok(res, { ok: true, service: 'edge-nexus-api', time: new Date().toISOString() });
  if (!path.startsWith('/api/')) {
    const requested = path === '/' ? '/index.html' : path;
    const file = path.resolve(ROOT, '.' + requested);
    if (file.startsWith(ROOT) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      const ext = path.extname(file);
      const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp' };
      res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream' });
      return fs.createReadStream(file).pipe(res);
    }
    return bad(res, 404, 'Not found');
  }

  try {
    if (path === '/api/auth/register' && req.method === 'POST') {
      const body = await readBody(req);
      const email = String(body.email || '').trim().toLowerCase();
      const fullName = String(body.fullName || '').trim();
      const password = String(body.password || '');
      if (!email || !fullName || password.length < 10) return bad(res, 400, 'Valid full name, email and password (10+ chars) are required');
      const password_hash = await passwordHash(password);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const user = (await client.query(`INSERT INTO users(email,full_name,password_hash,tenant_id) VALUES($1,$2,$3,(SELECT id FROM tenants WHERE slug='edge-nexus')) RETURNING id,email,full_name,role`, [email, fullName, password_hash])).rows[0];
        await client.query(`INSERT INTO accounts(user_id,currency) VALUES($1,'USD')`, [user.id]);
        await client.query(`INSERT INTO trading_accounts(user_id,account_number,risk_profile_id,account_type,balance,equity) VALUES($1,$2,(SELECT rp.id FROM risk_profiles rp JOIN users u ON u.tenant_id=rp.tenant_id WHERE u.id=$1 AND rp.name='Standard' LIMIT 1),'demo',10000,10000)`, [user.id, accountNumber()]);
        await client.query('COMMIT');
        const token = await createSession(user.id);
        res.setHeader('set-cookie', cookie('session', token, 60 * 60 * 24 * 30));
        await audit(user.id, 'auth.register', req);
        return json(res, 201, { user });
      } catch (e) { await client.query('ROLLBACK'); if (e.code === '23505') return bad(res, 409, 'An account with that email already exists'); throw e; } finally { client.release(); }
    }
    if (path === '/api/auth/login' && req.method === 'POST') {
      const body = await readBody(req); const email = String(body.email || '').trim().toLowerCase(); const password = String(body.password || '');
      const { rows } = await pool.query(`SELECT id,email,full_name,role,password_hash,status FROM users WHERE email=$1`, [email]);
      const user = rows[0]; if (!user || user.status !== 'active' || !(await verifyPassword(password, user.password_hash))) return bad(res, 401, 'Invalid credentials');
      const token = await createSession(user.id); res.setHeader('set-cookie', cookie('session', token, 60 * 60 * 24 * 30));
      await audit(user.id, 'auth.login', req); return ok(res, { user: { id:user.id,email:user.email,fullName:user.full_name,role:user.role } });
    }
    if (path === '/api/auth/logout' && req.method === 'POST') {
      const token = parseCookies(req).session; if (token) await pool.query(`DELETE FROM sessions WHERE token_hash=$1`, [hash(token)]);
      res.setHeader('set-cookie', cookie('session', '', 0)); return ok(res, { ok: true });
    }

    if (path.startsWith('/api/webhooks/payments/') && req.method === 'POST') {
      const signature = req.headers['x-webhook-signature'];
      const payload = await readRawBody(req);
      const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex');
      if (!signature || !timingSafe(String(signature), expected)) return bad(res, 401, 'Invalid webhook signature');
      let event; try { event = JSON.parse(payload); } catch { return bad(res, 400, 'Invalid webhook JSON'); }
      const { event_id, provider_ref, status, amount, currency, user_id } = event;
      if (!event_id || !provider_ref || !status) return bad(res, 400, 'Missing webhook event fields');
      if (status !== 'paid' && status !== 'succeeded' && status !== 'completed') return ok(res, { received:true, ignored:true });
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const intent = (await client.query(`SELECT * FROM payment_intents WHERE provider_ref=$1 FOR UPDATE`, [provider_ref])).rows[0];
        if (!intent) { await client.query('ROLLBACK'); return bad(res, 404, 'Payment intent not found'); }
        const duplicate = (await client.query(`SELECT id FROM ledger_entries WHERE external_ref=$1`, [event_id])).rows[0];
        if (duplicate) { await client.query('COMMIT'); return ok(res, { received:true, duplicate:true }); }
        const settledAmount = Number(amount ?? intent.amount);
        if (settledAmount <= 0 || settledAmount !== Number(intent.amount) || String(currency || intent.currency).toUpperCase() !== intent.currency) { await client.query('ROLLBACK'); return bad(res, 400, 'Webhook amount/currency does not match intent'); }
        const account = (await client.query(`SELECT id FROM accounts WHERE user_id=$1 AND currency=$2 FOR UPDATE`, [intent.user_id, intent.currency])).rows[0];
        if (!account) { await client.query('ROLLBACK'); return bad(res, 400, 'Settlement account not found'); }
        await client.query(`UPDATE payment_intents SET status='succeeded',updated_at=now() WHERE id=$1`, [intent.id]);
        await client.query(`UPDATE accounts SET balance=balance+$1,available_balance=available_balance+$1 WHERE id=$2`, [settledAmount, account.id]);
        await client.query(`INSERT INTO ledger_entries(user_id,account_id,type,direction,amount,currency,status,external_ref,metadata) VALUES($1,$2,'deposit','credit',$3,$4,'posted',$5,$6)`, [intent.user_id,account.id,settledAmount,intent.currency,event_id,JSON.stringify({ paymentIntentId:intent.id, providerRef:provider_ref })]);
        await client.query('COMMIT');
        emit(intent.user_id,'balance.updated',{ currency:intent.currency, amount:settledAmount, paymentIntentId:intent.id });
        return ok(res, { received:true, settled:true });
      } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    }

    const user = await authenticate(req);
    if (!user) return bad(res, 401, 'Authentication required');

    if (path === '/api/me' && req.method === 'GET') return ok(res, { user: { id:user.user_id,email:user.email,fullName:user.full_name,role:user.role } });
    if (path === '/api/tenant/config' && req.method === 'GET') {
      const tenant=(await pool.query(`SELECT id,slug,name,legal_name,default_currency,status,branding FROM tenants WHERE id=(SELECT tenant_id FROM users WHERE id=$1)`,[user.user_id])).rows[0];
      return ok(res,{tenant});
    }
    if (path.startsWith('/api/admin/')) {
      requireRole(user,['admin','support','finance']);
      if (path === '/api/admin/overview' && req.method === 'GET') {
        const [clients,accounts,withdrawals,volume,risk] = await Promise.all([
          pool.query(`SELECT COUNT(*)::int count FROM users WHERE tenant_id=(SELECT tenant_id FROM users WHERE id=$1) AND role='client'`,[user.user_id]),
          pool.query(`SELECT COUNT(*)::int count,COALESCE(SUM(balance),0) balance,COALESCE(SUM(equity),0) equity FROM trading_accounts WHERE user_id IN (SELECT id FROM users WHERE tenant_id=(SELECT tenant_id FROM users WHERE id=$1))`,[user.user_id]),
          pool.query(`SELECT COUNT(*)::int count,COALESCE(SUM(amount),0) amount FROM withdrawals w JOIN users u ON u.id=w.user_id WHERE u.tenant_id=(SELECT tenant_id FROM users WHERE id=$1) AND w.status='pending'`,[user.user_id]),
          pool.query(`SELECT COUNT(*)::int count,COALESCE(SUM(quantity*price),0) notional FROM executions e JOIN users u ON u.id=(SELECT user_id FROM trading_accounts ta WHERE ta.id=e.trading_account_id) WHERE u.tenant_id=(SELECT tenant_id FROM users WHERE id=$1) AND e.executed_at>=now()-interval '24 hours'`,[user.user_id]),
          pool.query(`SELECT risk_state,COUNT(*)::int count FROM trading_accounts WHERE user_id IN (SELECT id FROM users WHERE tenant_id=(SELECT tenant_id FROM users WHERE id=$1)) GROUP BY risk_state ORDER BY risk_state`,[user.user_id])
        ]);
        return ok(res,{clients:clients.rows[0],accounts:accounts.rows[0],withdrawals:withdrawals.rows[0],volume24h:volume.rows[0],risk:risk.rows});
      }
      if (path === '/api/admin/clients' && req.method === 'GET') {
        const limit=Math.min(Number(url.searchParams.get('limit')||50),200);
        const {rows}=await pool.query(`SELECT u.id,u.full_name,u.email,u.status,u.created_at,COALESCE(k.status,'not_started') kyc_status,COUNT(ta.id)::int trading_accounts,COALESCE(SUM(ta.equity),0) equity FROM users u LEFT JOIN kyc_profiles k ON k.user_id=u.id LEFT JOIN trading_accounts ta ON ta.user_id=u.id WHERE u.tenant_id=(SELECT tenant_id FROM users WHERE id=$1) AND u.role='client' GROUP BY u.id,k.status ORDER BY u.created_at DESC LIMIT $2`,[user.user_id,limit]);
        return ok(res,{clients:rows});
      }
      if (path === '/api/admin/withdrawals' && req.method === 'GET') {
        const {rows}=await pool.query(`SELECT w.*,u.full_name,u.email,k.status kyc_status FROM withdrawals w JOIN users u ON u.id=w.user_id LEFT JOIN kyc_profiles k ON k.user_id=u.id WHERE u.tenant_id=(SELECT tenant_id FROM users WHERE id=$1) ORDER BY w.created_at DESC LIMIT 100`,[user.user_id]);
        return ok(res,{withdrawals:rows});
      }
      if (path === '/api/admin/risk/exposure' && req.method === 'GET') {
        const {rows}=await pool.query(`SELECT p.symbol,p.side,COUNT(*)::int positions,COALESCE(SUM(p.quantity),0) lots,COALESCE(SUM(p.quantity*i.contract_size),0) units,COALESCE(SUM(p.unrealized_pnl),0) unrealized_pnl FROM positions p JOIN instruments i ON i.symbol=p.symbol JOIN users u ON u.id=p.user_id WHERE u.tenant_id=(SELECT tenant_id FROM users WHERE id=$1) AND p.status='open' GROUP BY p.symbol,p.side ORDER BY p.symbol,p.side`,[user.user_id]);
        return ok(res,{exposure:rows});
      }
      if (path === '/api/admin/accounts' && req.method === 'GET') {
        const {rows}=await pool.query(`SELECT ta.id,ta.account_number,ta.name,ta.currency,ta.leverage,ta.balance,ta.equity,ta.margin_used,ta.margin_available,ta.margin_level,ta.risk_state,ta.status,u.full_name,u.email FROM trading_accounts ta JOIN users u ON u.id=ta.user_id WHERE u.tenant_id=(SELECT tenant_id FROM users WHERE id=$1) ORDER BY ta.updated_at DESC LIMIT 200`,[user.user_id]);
        return ok(res,{accounts:rows});
      }
      if (path === '/api/admin/pricing' && req.method === 'GET') {
        const assetClass = url.searchParams.get('assetClass');
        const instruments = await mt5.getInstrumentUniverse({ assetClass });
        return ok(res, { instruments, mode: 'MT5_PARITY', note: 'Spread, commission and swap values are broker/account specific and are populated by the authorized MT5 adapter.' });
      }
      if (path === '/api/admin/mt5/specs' && req.method === 'POST') {
        requireRole(user,['admin']);
        const body = await readBody(req);
        const specs = Array.isArray(body.specs) ? body.specs : [];
        if (!specs.length || specs.length > 2000) return bad(res,400,'specs must contain 1 to 2000 instrument records');
        const tenantId = (await pool.query(`SELECT tenant_id FROM users WHERE id=$1`,[user.user_id])).rows[0]?.tenant_id;
        const raw = JSON.stringify(specs);
        const payloadHash = hash(raw);
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          let accepted=0;
          for (const spec of specs) {
            const symbol=String(spec.symbol||'').trim().toUpperCase(); if(!symbol) continue;
            const inst=(await client.query(`SELECT symbol FROM instruments WHERE symbol=$1`,[symbol])).rows[0];
            if(!inst) continue;
            await client.query(`UPDATE instruments SET min_lot=COALESCE($2,min_lot),max_lot=COALESCE($3,max_lot),lot_step=COALESCE($4,lot_step),contract_size=COALESCE($5,contract_size),digits=COALESCE($6,digits),trade_enabled=COALESCE($7,trade_enabled) WHERE symbol=$1`,[symbol,num(spec.minLot),num(spec.maxLot),num(spec.lotStep),num(spec.contractSize),spec.digits==null?null:Number(spec.digits),spec.tradeEnabled==null?null:Boolean(spec.tradeEnabled)]);
            await client.query(`INSERT INTO instrument_pricing(symbol,pricing_source,spread_mode,spread_points,commission_type,commission_value,commission_currency,swap_long,swap_short,swap_type,source_symbol,source_account,effective_at,updated_at) VALUES($1,'mt5_adapter',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12,now()),now()) ON CONFLICT(symbol) DO UPDATE SET pricing_source=EXCLUDED.pricing_source,spread_mode=EXCLUDED.spread_mode,spread_points=EXCLUDED.spread_points,commission_type=EXCLUDED.commission_type,commission_value=EXCLUDED.commission_value,commission_currency=EXCLUDED.commission_currency,swap_long=EXCLUDED.swap_long,swap_short=EXCLUDED.swap_short,swap_type=EXCLUDED.swap_type,source_symbol=EXCLUDED.source_symbol,source_account=EXCLUDED.source_account,effective_at=EXCLUDED.effective_at,updated_at=now()`,[symbol,spec.spreadMode||'broker_feed',num(spec.spreadPoints),spec.commissionType||'per_lot',num(spec.commissionValue)||0,String(spec.commissionCurrency||'USD').slice(0,3).toUpperCase(),num(spec.swapLong)||0,num(spec.swapShort)||0,spec.swapType||'points',String(spec.sourceSymbol||symbol),spec.sourceAccount||null,spec.effectiveAt?new Date(spec.effectiveAt):null]);
            accepted++;
          }
          const imp=(await client.query(`INSERT INTO instrument_specs_imports(tenant_id,source,source_account,payload_hash,row_count,status,created_by) VALUES($1,'mt5', $2,$3,$4,$5,$6) RETURNING *`,[tenantId,body.sourceAccount||null,payloadHash,specs.length,accepted===specs.length?'accepted':accepted?'partial':'rejected',user.user_id])).rows[0];
          await client.query('COMMIT');
          await audit(user.user_id,'broker.mt5.specs_imported',req,{importId:imp.id,rowCount:specs.length,accepted});
          return ok(res,{import:imp,accepted});
        } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
      }
      if (path === '/api/admin/connectivity' && req.method === 'GET') {
        const { rows } = await pool.query(`SELECT bc.*,t.name tenant_name FROM broker_connections bc JOIN tenants t ON t.id=bc.tenant_id WHERE bc.tenant_id=(SELECT tenant_id FROM users WHERE id=$1) ORDER BY bc.provider,bc.name`, [user.user_id]);
        return ok(res,{connections:rows});
      }
      if (path === '/api/admin/reconciliation/exceptions' && req.method === 'GET') {
        const { rows } = await pool.query(`SELECT * FROM reconciliation_exceptions WHERE tenant_id=(SELECT tenant_id FROM users WHERE id=$1) AND status='open' ORDER BY created_at DESC LIMIT 200`, [user.user_id]);
        return ok(res,{exceptions:rows});
      }
      if (path === '/api/admin/reconciliation/run' && req.method === 'POST') {
        const body=await readBody(req); const tenantId=(await pool.query(`SELECT tenant_id FROM users WHERE id=$1`,[user.user_id])).rows[0]?.tenant_id;
        const connectionId=body.connectionId || null; const run=(await pool.query(`INSERT INTO reconciliation_runs(tenant_id,connection_id,run_type) VALUES($1,$2,$3) RETURNING *`,[tenantId,connectionId,body.runType||'full'])).rows[0];
        try {
          const accounts=(await pool.query(`SELECT ta.id,ta.account_number,ta.external_account_id FROM trading_accounts ta JOIN users u ON u.id=ta.user_id WHERE u.tenant_id=$1`,[tenantId])).rows;
          let connected=0, pending=0;
          for (const account of accounts) { const result=await execution.syncAccount(account); if(result.status==='connected') connected++; else pending++; }
          const summary={accountsChecked:accounts.length,connected,pending};
          await pool.query(`UPDATE reconciliation_runs SET status='completed',completed_at=now(),summary=$1 WHERE id=$2`,[JSON.stringify(summary),run.id]);
          await audit(user.user_id,'broker.reconciliation.completed',req,{runId:run.id,summary});
          return ok(res,{run:{...run,status:'completed',summary}});
        } catch(e) { await pool.query(`UPDATE reconciliation_runs SET status='failed',completed_at=now(),error=$1 WHERE id=$2`,[e.message,run.id]); throw e; }
      }
      if (path === '/api/admin/connectivity/heartbeat' && req.method === 'POST') {
        const body=await readBody(req); const tenantId=(await pool.query(`SELECT tenant_id FROM users WHERE id=$1`,[user.user_id])).rows[0]?.tenant_id;
        const {rows}=await pool.query(`UPDATE broker_connections SET status=$1,last_heartbeat_at=now(),updated_at=now(),last_error=$2 WHERE id=$3 AND tenant_id=$4 RETURNING *`,[body.status||'connected',body.error||null,body.connectionId,tenantId]);
        if(!rows[0]) return bad(res,404,'Connection not found'); return ok(res,{connection:rows[0]});
      }
      if (path === '/api/admin/audit' && req.method === 'GET') {
        const {rows}=await pool.query(`SELECT a.id,a.event_type,a.ip_address,a.user_agent,a.payload,a.created_at,u.email FROM audit_events a LEFT JOIN users u ON u.id=a.user_id WHERE u.tenant_id=(SELECT tenant_id FROM users WHERE id=$1) OR a.user_id IS NULL ORDER BY a.created_at DESC LIMIT 200`,[user.user_id]);
        return ok(res,{events:rows});
      }
      const review=path.match(/^\/api\/admin\/withdrawals\/([0-9a-f-]+)\/(approve|reject|hold)$/i);
      if (review && req.method==='POST') {
        if (user.role!=='admin' && user.role!=='finance') return bad(res,403,'Finance privileges required');
        const body=await readBody(req); const note=String(body.note||'').trim(); const action=review[2];
        const client=await pool.connect();
        try { await client.query('BEGIN'); const w=(await client.query(`SELECT w.*,u.tenant_id FROM withdrawals w JOIN users u ON u.id=w.user_id WHERE w.id=$1 FOR UPDATE`,[review[1]])).rows[0]; if(!w) {await client.query('ROLLBACK');return bad(res,404,'Withdrawal not found');} if(w.tenant_id !== (await pool.query(`SELECT tenant_id FROM users WHERE id=$1`,[user.user_id])).rows[0].tenant_id){await client.query('ROLLBACK');return bad(res,403,'Cross-tenant access denied');} if(w.status!=='pending'){await client.query('ROLLBACK');return ok(res,{withdrawal:w,unchanged:true});}
          if(action==='reject'){ const acct=(await client.query(`SELECT id FROM accounts WHERE user_id=$1 AND currency=$2 FOR UPDATE`,[w.user_id,w.currency])).rows[0]; if(acct) await client.query(`UPDATE accounts SET balance=balance+$1,available_balance=available_balance+$1 WHERE id=$2`,[w.amount,acct.id]); await client.query(`UPDATE ledger_entries SET status='reversed',metadata=metadata||$1 WHERE metadata->>'withdrawalId'=$2`,[JSON.stringify({review:'rejected'}),w.id]); }
          await client.query(`UPDATE withdrawals SET status=$1,review_note=$2,updated_at=now() WHERE id=$3`,[action==='approve'?'approved':action==='reject'?'rejected':'pending',note,w.id]); await client.query(`INSERT INTO withdrawal_reviews(withdrawal_id,reviewer_id,action,note) VALUES($1,$2,$3,$4)`,[w.id,user.user_id,action,note]); await client.query('COMMIT'); await audit(user.user_id,`admin.withdrawal.${action}`,req,{withdrawalId:w.id}); emit(w.user_id,'withdrawal.updated',{id:w.id,status:action==='approve'?'approved':action==='reject'?'rejected':'pending'}); return ok(res,{withdrawal:{id:w.id,status:action==='approve'?'approved':action==='reject'?'rejected':'pending'}});
        } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
      }
      return bad(res,404,'Admin route not found');
    }

    if (path === '/api/dashboard/earnings' && req.method === 'GET') {
      const days = Math.min(Math.max(Number(url.searchParams.get('days') || 7), 1), 90);
      const { rows } = await pool.query(`SELECT date_trunc('day',created_at)::date day, COALESCE(SUM(CASE WHEN direction='credit' THEN amount ELSE 0 END),0) credits, COALESCE(SUM(CASE WHEN direction='debit' THEN amount ELSE 0 END),0) debits FROM ledger_entries WHERE user_id=$1 AND created_at >= now() - ($2 || ' days')::interval GROUP BY 1 ORDER BY 1`, [user.user_id, days]);
      return ok(res, { days: rows });
    }
    if (path === '/api/dashboard/summary' && req.method === 'GET') {
      const { rows } = await pool.query(`SELECT a.currency,a.balance,a.available_balance,a.margin_used, COALESCE((SELECT SUM(CASE WHEN direction='credit' THEN amount ELSE 0 END) FROM ledger_entries l WHERE l.account_id=a.id),0) total_credits FROM accounts a WHERE a.user_id=$1 ORDER BY a.currency`, [user.user_id]);
      return ok(res, { accounts: rows, market: { status: 'live-ready', source: 'server' } });
    }
    if (path === '/api/wallet/balances' && req.method === 'GET') {
      const { rows } = await pool.query(`SELECT currency,balance,available_balance,margin_used FROM accounts WHERE user_id=$1 ORDER BY currency`, [user.user_id]); return ok(res, { balances: rows });
    }
    if (path === '/api/wallet/transactions' && req.method === 'GET') {
      const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
      const { rows } = await pool.query(`SELECT id,type,direction,amount,currency,status,external_ref,metadata,created_at FROM ledger_entries WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`, [user.user_id, limit]); return ok(res, { transactions: rows });
    }
    if (path === '/api/wallet/withdrawals' && req.method === 'GET') {
      const limit = Math.min(Number(url.searchParams.get('limit') || 50), 200);
      const { rows } = await pool.query(`SELECT id,amount,currency,destination,status,review_note,created_at,updated_at FROM withdrawals WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`, [user.user_id, limit]);
      return ok(res, { withdrawals: rows });
    }
    if (path === '/api/kyc' && req.method === 'GET') {
      const { rows } = await pool.query(`SELECT status,level,country_code,document_type,review_note,submitted_at,reviewed_at,updated_at FROM kyc_profiles WHERE user_id=$1`, [user.user_id]);
      return ok(res, { kyc: rows[0] || { status:'not_started', level:'basic' } });
    }
    if (path === '/api/kyc' && req.method === 'POST') {
      const body = await readBody(req);
      const countryCode = String(body.countryCode || '').trim().toUpperCase().slice(0, 2);
      const documentType = String(body.documentType || '').trim().slice(0, 40);
      if (!countryCode || !documentType) return bad(res, 400, 'Country and document type are required');
      const { rows } = await pool.query(`INSERT INTO kyc_profiles(user_id,tenant_id,status,level,country_code,document_type,submitted_at,updated_at) VALUES($1,(SELECT tenant_id FROM users WHERE id=$1),'pending','basic',$2,$3,now(),now()) ON CONFLICT(user_id) DO UPDATE SET status='pending',country_code=EXCLUDED.country_code,document_type=EXCLUDED.document_type,submitted_at=now(),review_note=NULL,updated_at=now() RETURNING status,level,country_code,document_type,submitted_at,updated_at`, [user.user_id,countryCode,documentType]);
      await audit(user.user_id,'kyc.submitted',req,{documentType}); emit(user.user_id,'kyc.updated',rows[0]);
      return json(res,201,{kyc:rows[0]});
    }
    if (path === '/api/wallet/deposit-intents' && req.method === 'POST') {
      const body = await readBody(req); const amount = Number(body.amount); const currency = String(body.currency || 'USD').toUpperCase(); const provider = String(body.provider || 'manual');
      if (!Number.isFinite(amount) || amount <= 0) return bad(res, 400, 'Invalid amount');
      const idem = requireIdempotency(req);
      const existing = await pool.query(`SELECT id,status,provider_ref,amount,currency FROM payment_intents WHERE user_id=$1 AND metadata->>'idempotency_key'=$2`, [user.user_id, idem]);
      if (existing.rows[0]) return ok(res, { intent: existing.rows[0] });
      const providerRef = `PI-${crypto.randomUUID()}`;
      const { rows } = await pool.query(`INSERT INTO payment_intents(user_id,provider,provider_ref,amount,currency,metadata) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,status,provider,provider_ref,amount,currency,created_at`, [user.user_id,provider,providerRef,amount,currency,JSON.stringify({ idempotency_key: idem })]);
      await audit(user.user_id, 'wallet.deposit_intent.created', req, { intentId: rows[0].id }); return json(res, 201, { intent: rows[0], message: 'Payment intent created. Balance is unchanged until verified settlement.' });
    }
    if (path === '/api/wallet/withdrawals' && req.method === 'POST') {
      const body = await readBody(req); const amount = Number(body.amount); const currency = String(body.currency || 'USD').toUpperCase(); const destination = String(body.destination || '').trim();
      if (!Number.isFinite(amount) || amount <= 0 || !destination) return bad(res, 400, 'Amount and destination are required');
      const idem = requireIdempotency(req);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const account = (await client.query(`SELECT id,available_balance FROM accounts WHERE user_id=$1 AND currency=$2 FOR UPDATE`, [user.user_id,currency])).rows[0];
        if (!account || Number(account.available_balance) < amount) { await client.query('ROLLBACK'); return bad(res, 400, 'Insufficient available balance'); }
        const prior = (await client.query(`SELECT id,status FROM withdrawals WHERE user_id=$1 AND idempotency_key=$2`, [user.user_id,idem])).rows[0];
        if (prior) { await client.query('ROLLBACK'); return ok(res, { withdrawal: prior }); }
        const withdrawal = (await client.query(`INSERT INTO withdrawals(user_id,amount,currency,destination,idempotency_key) VALUES($1,$2,$3,$4,$5) RETURNING id,status,amount,currency,destination,created_at`, [user.user_id,amount,currency,destination,idem])).rows[0];
        await client.query(`UPDATE accounts SET available_balance=available_balance-$1,balance=balance-$1 WHERE id=$2`, [amount,account.id]);
        await client.query(`INSERT INTO ledger_entries(user_id,account_id,type,direction,amount,currency,status,metadata) VALUES($1,$2,'withdrawal','debit',$3,$4,'pending',$5)`, [user.user_id,account.id,amount,currency,JSON.stringify({ withdrawalId: withdrawal.id })]);
        await client.query('COMMIT'); await audit(user.user_id,'wallet.withdrawal.created',req,{withdrawalId:withdrawal.id}); emit(user.user_id,'withdrawal.updated',withdrawal);
        return json(res,201,{ withdrawal });
      } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    }
    // ---------------- Forex trading domain ----------------
    if (path === '/api/trading/instruments' && req.method === 'GET') {
      const assetClass = url.searchParams.get('assetClass');
      const instruments = await mt5.getInstrumentUniverse({ assetClass });
      return ok(res, { instruments, source: 'MT5_COMPATIBLE_CATALOG', pricing: 'MT5_PARITY_FIELDS' });
    }
    if (path === '/api/trading/quotes' && req.method === 'GET') {
      return ok(res, { quotes: await mt5.getQuotes(), source: 'MT5_ADAPTER_PENDING' });
    }
    if (path === '/api/trading/demo-account' && req.method === 'GET') {
      const account = (await pool.query(`SELECT * FROM trading_accounts WHERE user_id=$1 AND account_type='demo' ORDER BY created_at LIMIT 1`,[user.user_id])).rows[0] || await ensureTradingAccount(user.user_id);
      return ok(res,{account});
    }
    if (path === '/api/trading/real/fund' && req.method === 'POST') {
      const body=await readBody(req); const amount=num(body.amount); const accountId=String(body.accountId||'');
      if(!amount || amount<=0 || !accountId) return bad(res,400,'Account and positive amount are required');
      const client=await pool.connect(); try { await client.query('BEGIN');
        const account=(await client.query(`SELECT id FROM accounts WHERE user_id=$1 AND currency='USD' FOR UPDATE`,[user.user_id])).rows[0];
        const trading=(await client.query(`SELECT * FROM trading_accounts WHERE id=$1 AND user_id=$2 AND account_type='real' FOR UPDATE`,[accountId,user.user_id])).rows[0];
        if(!account || !trading){await client.query('ROLLBACK');return bad(res,404,'Real trading account or USD wallet not found');}
        if(Number(account.available_balance)<amount){await client.query('ROLLBACK');return bad(res,400,'Insufficient settled wallet balance');}
        await client.query(`UPDATE accounts SET balance=balance-$1,available_balance=available_balance-$1 WHERE id=$2`,[amount,account.id]);
        const updated=(await client.query(`UPDATE trading_accounts SET balance=balance+$1,equity=equity+$1,margin_available=margin_available+$1,updated_at=now() WHERE id=$2 RETURNING *`,[amount,trading.id])).rows[0];
        await client.query(`INSERT INTO ledger_entries(user_id,account_id,type,direction,amount,currency,status,metadata) VALUES($1,$2,'trading_fund_transfer','debit',$3,'USD','posted',$4)`,[user.user_id,account.id,amount,JSON.stringify({tradingAccountId:trading.id})]);
        await client.query('COMMIT'); await audit(user.user_id,'trading.real_account.funded',req,{accountId,amount}); emit(user.user_id,'real.account.funded',updated); return ok(res,{account:updated,amount});
      } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
    }
    if (path === '/api/trading/demo/reload' && req.method === 'POST') {
      const client=await pool.connect();
      try { await client.query('BEGIN');
        const account=(await client.query(`SELECT * FROM trading_accounts WHERE user_id=$1 AND account_type='demo' FOR UPDATE`,[user.user_id])).rows[0];
        if(!account){ await client.query('ROLLBACK'); return bad(res,404,'Demo account not found'); }
        const open=(await client.query(`SELECT COUNT(*)::int count FROM positions WHERE trading_account_id=$1 AND status='open'`,[account.id])).rows[0].count;
        if(open>0){ await client.query('ROLLBACK'); return bad(res,400,'Close all demo positions before reloading demo funds'); }
        const updated=(await client.query(`UPDATE trading_accounts SET balance=10000,equity=10000,margin_used=0,margin_available=10000,margin_level=0,risk_state='normal',updated_at=now() WHERE id=$1 RETURNING *`,[account.id])).rows[0];
        await client.query('COMMIT'); await audit(user.user_id,'demo.funds.reloaded',req,{accountId:account.id,amount:10000}); emit(user.user_id,'demo.funds_reloaded',updated); return ok(res,{account:updated,amount:10000});
      } catch(e){await client.query('ROLLBACK');throw e;} finally{client.release();}
    }
    if (path === '/api/trading/accounts' && req.method === 'GET') {
      await ensureTradingAccount(user.user_id);
      const { rows } = await pool.query(`SELECT id,account_number,name,currency,leverage,account_type,balance,equity,margin_used,margin_available,status,created_at FROM trading_accounts WHERE user_id=$1 ORDER BY account_type,created_at`, [user.user_id]);
      return ok(res, { accounts: rows });
    }
    if (path === '/api/trading/accounts' && req.method === 'POST') {
      const body = await readBody(req); const name = String(body.name || 'Standard Trading Account').trim(); const leverage = Number(body.leverage || 100); const accountType = body.accountType === 'real' ? 'real' : 'demo';
      if (!name || !Number.isInteger(leverage) || leverage < 1 || leverage > 1000) return bad(res, 400, 'Valid account name and leverage are required');
      const { rows } = await pool.query(`INSERT INTO trading_accounts(user_id,account_number,name,leverage,risk_profile_id,account_type,balance,equity) VALUES($1,$2,$3,$4,(SELECT rp.id FROM risk_profiles rp JOIN users u ON u.tenant_id=rp.tenant_id WHERE u.id=$1 AND rp.name='Standard' LIMIT 1),$5,CASE WHEN $5='demo' THEN 10000 ELSE 0 END,CASE WHEN $5='demo' THEN 10000 ELSE 0 END) RETURNING id,account_number,name,currency,leverage,account_type,balance,equity,margin_used,margin_available,margin_level,risk_state,status,created_at`, [user.user_id,accountNumber(),name,leverage,accountType]);
      await audit(user.user_id,'trading.account.created',req,{accountId:rows[0].id});
      return json(res,201,{ account: rows[0] });
    }
    if (path === '/api/trading/orders' && req.method === 'GET') {
      const accountId = url.searchParams.get('accountId');
      const { rows } = await pool.query(`SELECT id,trading_account_id,symbol,side,order_type,quantity,requested_price,stop_loss,take_profit,status,filled_quantity,average_fill_price,rejection_reason,created_at,updated_at FROM orders WHERE user_id=$1 AND ($2::uuid IS NULL OR trading_account_id=$2) ORDER BY created_at DESC LIMIT 100`, [user.user_id, accountId || null]);
      return ok(res,{ orders: rows });
    }
    if (path === '/api/trading/orders' && req.method === 'POST') {
      const body = await readBody(req); const idem = requireIdempotency(req);
      const accountId = String(body.accountId || ''); const symbol = String(body.symbol || '').toUpperCase(); const side = String(body.side || '').toLowerCase();
      const orderType = String(body.orderType || 'market').toLowerCase(); const quantity = num(body.quantity); const stopLoss = body.stopLoss == null ? null : num(body.stopLoss); const takeProfit = body.takeProfit == null ? null : num(body.takeProfit);
      if (!accountId || !symbol || !['buy','sell'].includes(side) || orderType !== 'market' || !quantity || quantity <= 0) return bad(res,400,'Account, symbol, side and positive quantity are required');
      const prior = await pool.query(`SELECT * FROM orders WHERE user_id=$1 AND idempotency_key=$2`, [user.user_id, idem]); if (prior.rows[0]) return ok(res,{ order: prior.rows[0], duplicate:true });
      const account = (await pool.query(`SELECT * FROM trading_accounts WHERE id=$1 AND user_id=$2 FOR UPDATE`, [accountId,user.user_id])).rows[0];
      if (!account || account.status !== 'active') return bad(res,400,'Trading account is unavailable');
      const instrument = (await pool.query(`SELECT * FROM instruments WHERE symbol=$1 AND enabled=true`, [symbol])).rows[0];
      if (!instrument) return bad(res,400,'Instrument is unavailable');
      const profile = await riskProfileForAccount(account.id);
      const maxLots = Math.min(Number(instrument.max_lot), Number(profile?.max_position_lots || instrument.max_lot));
      const openLots = Number((await pool.query(`SELECT COALESCE(SUM(quantity),0) total FROM positions WHERE trading_account_id=$1 AND status='open'`,[account.id])).rows[0].total);
      if (quantity < Number(instrument.min_lot) || quantity > maxLots || openLots + quantity > maxLots) return bad(res,400,'Quantity is outside risk limits');
      const quote = await execution.placeMarketOrder({symbol,side,quantity,account}); const price = quote.price;
      const notional = quantity * Number(instrument.contract_size) * price;
      const requiredMargin = notional / Number(account.leverage);
      const summary = await accountSummary(account.id);
      if (!summary || summary.marginAvailable < requiredMargin) return bad(res,400,'Insufficient margin');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const order = (await client.query(`INSERT INTO orders(trading_account_id,user_id,symbol,side,order_type,quantity,stop_loss,take_profit,status,filled_quantity,average_fill_price,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,'filled',$6,$9,$10) RETURNING *`, [account.id,user.user_id,symbol,side,orderType,quantity,stopLoss,takeProfit,price,idem])).rows[0];
        await client.query(`INSERT INTO executions(order_id,trading_account_id,symbol,side,quantity,price,liquidity_provider) VALUES($1,$2,$3,$4,$5,$6,$7)`, [order.id,account.id,symbol,side,quantity,price,quote.liquidityProvider]);
        const positionSide = side === 'buy' ? 'long' : 'short';
        await client.query(`INSERT INTO positions(trading_account_id,user_id,symbol,side,quantity,entry_price,stop_loss,take_profit) VALUES($1,$2,$3,$4,$5,$6,$7,$8)`, [account.id,user.user_id,symbol,positionSide,quantity,price,stopLoss,takeProfit]);
        await client.query(`UPDATE trading_accounts SET margin_used=margin_used+$1,updated_at=now() WHERE id=$2`, [requiredMargin,account.id]);
        await client.query('COMMIT');
        await audit(user.user_id,'trading.order.filled',req,{orderId:order.id,symbol,side,quantity,price});
        emit(user.user_id,'order.updated',order); emit(user.user_id,'position.updated',{accountId:account.id,symbol});
        return json(res,201,{ order, execution:{price,liquidityProvider:quote.liquidityProvider} });
      } catch(e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    }
    const closeMatch = path.match(/^\/api\/trading\/positions\/([0-9a-f-]+)\/close$/i);
    if (closeMatch && req.method === 'POST') {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const position = (await client.query(`SELECT p.*,i.contract_size,q.bid,q.ask,ta.leverage FROM positions p JOIN instruments i ON i.symbol=p.symbol JOIN market_quotes q ON q.symbol=p.symbol JOIN trading_accounts ta ON ta.id=p.trading_account_id WHERE p.id=$1 AND p.user_id=$2 AND p.status='open' FOR UPDATE`, [closeMatch[1],user.user_id])).rows[0];
        if (!position) { await client.query('ROLLBACK'); return bad(res,404,'Open position not found'); }
        const closeQuote = await execution.closePosition({symbol:position.symbol,side:position.side,quantity:Number(position.quantity),account:position});
        const closePrice = Number(closeQuote.price);
        const pnl = positionPnl(position, {bid: closePrice, ask: closePrice}, position.contract_size);
        const releasedMargin = Number(position.quantity) * Number(position.contract_size) * Number(position.entry_price) / Number(position.leverage);
        await client.query(`UPDATE positions SET status='closed',closed_at=now(),close_price=$1,realized_pnl=$2,unrealized_pnl=0,external_position_id=COALESCE(external_position_id,$3),updated_at=now() WHERE id=$4`, [closePrice,pnl,closeQuote.brokerOrderId,position.id]);
        await client.query(`UPDATE trading_accounts SET balance=balance+$1,margin_used=GREATEST(0,margin_used-$2),updated_at=now() WHERE id=$3`, [pnl,releasedMargin,position.trading_account_id]);
        await client.query('COMMIT');
        const summary=await recalcTradingAccount(position.trading_account_id);
        await audit(user.user_id,'trading.position.closed',req,{positionId:position.id,symbol:position.symbol,pnl});
        emit(user.user_id,'position.closed',{positionId:position.id,pnl,summary});
        return ok(res,{positionId:position.id,closePrice,pnl,summary});
      } catch(e){ await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    }
    const cancelMatch = path.match(/^\/api\/trading\/orders\/([0-9a-f-]+)\/cancel$/i);
    if (cancelMatch && req.method === 'POST') {
      const { rows } = await pool.query(`UPDATE orders SET status='cancelled',updated_at=now() WHERE id=$1 AND user_id=$2 AND status='pending' RETURNING *`, [cancelMatch[1],user.user_id]);
      if (!rows[0]) return bad(res,404,'Pending order not found');
      emit(user.user_id,'order.updated',rows[0]); return ok(res,{order:rows[0]});
    }
    if (path === '/api/trading/positions' && req.method === 'GET') {
      const accountId = url.searchParams.get('accountId');
      const { rows } = await pool.query(`SELECT p.*,i.contract_size,q.bid,q.ask FROM positions p JOIN instruments i ON i.symbol=p.symbol JOIN market_quotes q ON q.symbol=p.symbol WHERE p.user_id=$1 AND p.status='open' AND ($2::uuid IS NULL OR p.trading_account_id=$2) ORDER BY p.opened_at DESC`, [user.user_id,accountId || null]);
      const positions = rows.map(p => { const mark=p.side==='long'?Number(p.bid):Number(p.ask); const diff=p.side==='long'?mark-Number(p.entry_price):Number(p.entry_price)-mark; return {...p,markPrice:mark,unrealizedPnl:diff*Number(p.quantity)*Number(p.contract_size)}; });
      return ok(res,{positions});
    }
    const summaryMatch = path.match(/^\/api\/trading\/account\/([0-9a-f-]+)\/summary$/i);
    if (summaryMatch && req.method === 'GET') {
      const account = (await pool.query(`SELECT id FROM trading_accounts WHERE id=$1 AND user_id=$2`,[summaryMatch[1],user.user_id])).rows[0];
      if (!account) return bad(res,404,'Trading account not found'); return ok(res,{summary:await accountSummary(account.id)});
    }
    if (path === '/api/trading/stream' && req.method === 'GET') {
      res.writeHead(200,{ 'content-type':'text/event-stream','cache-control':'no-cache','connection':'keep-alive','access-control-allow-origin':APP_ORIGIN,'access-control-allow-credentials':'true' });
      res.write(`event: connected\ndata: ${JSON.stringify({at:new Date().toISOString(),source:process.env.MT5_BRIDGE_NAME || 'MT5_ADAPTER_PENDING'})}\n\n`);
      if (!tradingStreams.has(user.user_id)) tradingStreams.set(user.user_id,new Set()); tradingStreams.get(user.user_id).add(res);
      const timer=setInterval(async()=>{ try { res.write(`event: quotes\ndata: ${JSON.stringify(await market.getQuotes())}\n\n`); } catch {} },5000);
      req.on('close',()=>{clearInterval(timer);tradingStreams.get(user.user_id)?.delete(res);}); return;
    }

    if (path === '/api/mining/plans' && req.method === 'GET') {
      return ok(res, { plans: [
        { id:'starter', name:'Nova Starter', hashrate:25, unit:'TH/s', price:99, durationDays:180 },
        { id:'pro', name:'Nova Pro', hashrate:100, unit:'TH/s', price:349, durationDays:365 },
        { id:'elite', name:'Nova Elite', hashrate:500, unit:'TH/s', price:1499, durationDays:730 }
      ] });
    }
    if (path === '/api/mining/contracts' && req.method === 'GET') return ok(res, { contracts: [] });
    if (path === '/api/stream/events' && req.method === 'GET') {
      res.writeHead(200, { 'content-type':'text/event-stream','cache-control':'no-cache','connection':'keep-alive','access-control-allow-origin':APP_ORIGIN,'access-control-allow-credentials':'true' });
      res.write(`event: connected\ndata: ${JSON.stringify({ at:new Date().toISOString() })}\n\n`);
      if (!streams.has(user.user_id)) streams.set(user.user_id, new Set()); streams.get(user.user_id).add(res);
      const timer = setInterval(() => res.write(`event: heartbeat\ndata: ${JSON.stringify({ at:new Date().toISOString() })}\n\n`), 25000);
      req.on('close', () => { clearInterval(timer); streams.get(user.user_id)?.delete(res); }); return;
    }

    return bad(res, 404, 'Not found');
  } catch (e) {
    console.error(e); return bad(res, e.status || 500, e.status ? e.message : 'Internal server error');
  }
}

setInterval(riskSweep, 5000);
const server = http.createServer(route);
server.listen(PORT, () => console.log(`Edge Nexus API listening on ${PORT}`));
