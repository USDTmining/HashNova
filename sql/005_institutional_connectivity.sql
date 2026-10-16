-- Edge Nexus Phase 5: institutional connectivity + reconciliation
CREATE TABLE IF NOT EXISTS broker_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  provider text NOT NULL CHECK (provider IN ('mt5','fix','lp','payment')), name text NOT NULL,
  status text NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected','testing','connected','paused','error')),
  environment text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox','production')),
  endpoint text, external_account text, config jsonb NOT NULL DEFAULT '{}',
  last_heartbeat_at timestamptz, last_sync_at timestamptz, last_error text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS broker_connections_tenant_provider_name ON broker_connections(tenant_id,provider,name);

CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id),
  connection_id uuid REFERENCES broker_connections(id), run_type text NOT NULL,
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','partial','failed')),
  started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz, summary jsonb NOT NULL DEFAULT '{}', error text
);
CREATE TABLE IF NOT EXISTS reconciliation_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES tenants(id), run_id uuid REFERENCES reconciliation_runs(id),
  entity_type text NOT NULL, entity_id uuid, external_id text, exception_type text NOT NULL,
  internal_value jsonb, external_value jsonb, status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','resolved')),
  created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE INDEX IF NOT EXISTS reconciliation_exceptions_tenant_status ON reconciliation_exceptions(tenant_id,status);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_order_id text;
ALTER TABLE executions ADD COLUMN IF NOT EXISTS external_execution_id text;
ALTER TABLE positions ADD COLUMN IF NOT EXISTS external_position_id text;
ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS external_account_id text;
CREATE INDEX IF NOT EXISTS orders_external_order_id_idx ON orders(external_order_id);
CREATE INDEX IF NOT EXISTS executions_external_execution_id_idx ON executions(external_execution_id);
CREATE INDEX IF NOT EXISTS positions_external_position_id_idx ON positions(external_position_id);

INSERT INTO broker_connections(tenant_id,provider,name,status,environment)
SELECT id,'mt5','MT5 Production Adapter','disconnected','sandbox' FROM tenants
WHERE NOT EXISTS (SELECT 1 FROM broker_connections bc WHERE bc.tenant_id=tenants.id AND bc.provider='mt5' AND bc.name='MT5 Production Adapter');
