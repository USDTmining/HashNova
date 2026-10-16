-- HashNova Phase 3: broker operations, tenancy, risk and compliance boundaries

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  legal_name TEXT,
  default_currency CHAR(3) NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','closed')),
  branding JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO tenants(slug,name,legal_name,branding)
VALUES ('hashnova','HashNova','HashNova Technologies','{"primary":"#12e995","accent":"#0b2132","product":"HashNova"}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);
UPDATE users SET tenant_id=(SELECT id FROM tenants WHERE slug='hashnova') WHERE tenant_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);

CREATE TABLE IF NOT EXISTS risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 100 CHECK (leverage BETWEEN 1 AND 1000),
  margin_call_pct NUMERIC(10,2) NOT NULL DEFAULT 100,
  stop_out_pct NUMERIC(10,2) NOT NULL DEFAULT 50,
  max_position_lots NUMERIC(18,8) NOT NULL DEFAULT 100,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id,name)
);

INSERT INTO risk_profiles(tenant_id,name,leverage,margin_call_pct,stop_out_pct,max_position_lots)
SELECT id,'Standard',100,100,50,100 FROM tenants WHERE slug='hashnova'
ON CONFLICT (tenant_id,name) DO NOTHING;

ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS risk_profile_id UUID REFERENCES risk_profiles(id);
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS margin_level NUMERIC(24,8) NOT NULL DEFAULT 0;
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS risk_state TEXT NOT NULL DEFAULT 'normal' CHECK (risk_state IN ('normal','margin_call','stop_out','restricted'));
UPDATE trading_accounts ta SET risk_profile_id=(SELECT rp.id FROM risk_profiles rp JOIN users u ON u.tenant_id=rp.tenant_id WHERE u.id=ta.user_id AND rp.name='Standard' LIMIT 1) WHERE ta.risk_profile_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_trading_accounts_risk_state ON trading_accounts(risk_state);

ALTER TABLE positions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed'));
ALTER TABLE positions ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS close_price NUMERIC(24,10);
CREATE INDEX IF NOT EXISTS idx_positions_open ON positions(trading_account_id,status);

CREATE TABLE IF NOT EXISTS kyc_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','pending','verified','rejected','expired')),
  level TEXT NOT NULL DEFAULT 'basic',
  provider_ref TEXT,
  review_note TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO kyc_profiles(user_id,tenant_id) SELECT id,tenant_id FROM users WHERE tenant_id IS NOT NULL ON CONFLICT (user_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS withdrawal_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id UUID NOT NULL REFERENCES withdrawals(id) ON DELETE RESTRICT,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('approve','reject','hold')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_withdrawal_reviews_withdrawal ON withdrawal_reviews(withdrawal_id,created_at DESC);
