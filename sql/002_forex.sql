-- HashNova / White-label Forex Trading Core
-- This schema is broker-neutral: a future MT5/FIX/LP adapter can populate executions.

CREATE TABLE IF NOT EXISTS trading_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  account_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Standard Trading Account',
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  leverage INTEGER NOT NULL DEFAULT 100 CHECK (leverage BETWEEN 1 AND 1000),
  balance NUMERIC(24,8) NOT NULL DEFAULT 0,
  equity NUMERIC(24,8) NOT NULL DEFAULT 0,
  margin_used NUMERIC(24,8) NOT NULL DEFAULT 0,
  margin_available NUMERIC(24,8) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','read_only','suspended','closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instruments (
  symbol TEXT PRIMARY KEY,
  base_asset TEXT NOT NULL,
  quote_asset TEXT NOT NULL,
  asset_class TEXT NOT NULL DEFAULT 'forex',
  contract_size NUMERIC(24,8) NOT NULL DEFAULT 100000,
  min_lot NUMERIC(18,8) NOT NULL DEFAULT 0.01,
  max_lot NUMERIC(18,8) NOT NULL DEFAULT 100,
  lot_step NUMERIC(18,8) NOT NULL DEFAULT 0.01,
  digits INTEGER NOT NULL DEFAULT 5,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS market_quotes (
  symbol TEXT PRIMARY KEY REFERENCES instruments(symbol) ON DELETE CASCADE,
  bid NUMERIC(24,10) NOT NULL,
  ask NUMERIC(24,10) NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  symbol TEXT NOT NULL REFERENCES instruments(symbol),
  side TEXT NOT NULL CHECK (side IN ('buy','sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market','limit','stop')),
  quantity NUMERIC(24,8) NOT NULL CHECK (quantity > 0),
  requested_price NUMERIC(24,10),
  stop_loss NUMERIC(24,10),
  take_profit NUMERIC(24,10),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','filled','cancelled','rejected')),
  filled_quantity NUMERIC(24,8) NOT NULL DEFAULT 0,
  average_fill_price NUMERIC(24,10),
  client_order_id TEXT,
  idempotency_key TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  symbol TEXT NOT NULL REFERENCES instruments(symbol),
  side TEXT NOT NULL CHECK (side IN ('long','short')),
  quantity NUMERIC(24,8) NOT NULL CHECK (quantity > 0),
  entry_price NUMERIC(24,10) NOT NULL,
  stop_loss NUMERIC(24,10),
  take_profit NUMERIC(24,10),
  unrealized_pnl NUMERIC(24,8) NOT NULL DEFAULT 0,
  realized_pnl NUMERIC(24,8) NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  trading_account_id UUID NOT NULL REFERENCES trading_accounts(id) ON DELETE RESTRICT,
  symbol TEXT NOT NULL REFERENCES instruments(symbol),
  side TEXT NOT NULL CHECK (side IN ('buy','sell')),
  quantity NUMERIC(24,8) NOT NULL CHECK (quantity > 0),
  price NUMERIC(24,10) NOT NULL,
  liquidity_provider TEXT,
  external_execution_id TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_user ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_account_created ON orders(trading_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_positions_account ON positions(trading_account_id);
CREATE INDEX IF NOT EXISTS idx_executions_account ON executions(trading_account_id, executed_at DESC);

INSERT INTO instruments(symbol,base_asset,quote_asset,contract_size,min_lot,max_lot,lot_step,digits)
VALUES
('EURUSD','EUR','USD',100000,0.01,100,0.01,5),
('GBPUSD','GBP','USD',100000,0.01,100,0.01,5),
('USDJPY','USD','JPY',100000,0.01,100,0.01,3),
('XAUUSD','XAU','USD',100,0.01,100,0.01,2),
('AUDUSD','AUD','USD',100000,0.01,100,0.01,5)
ON CONFLICT (symbol) DO NOTHING;

INSERT INTO market_quotes(symbol,bid,ask)
VALUES
('EURUSD',1.16230,1.16240),
('GBPUSD',1.33710,1.33730),
('USDJPY',151.82000,151.84000),
('XAUUSD',4338.20,4338.80),
('AUDUSD',0.65380,0.65400)
ON CONFLICT (symbol) DO NOTHING;
