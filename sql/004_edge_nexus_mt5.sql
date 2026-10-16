-- Edge Nexus Phase 4: MT5-compatible instrument universe and broker pricing parity.
-- IMPORTANT: MT5 instruments, spreads, commissions and swaps are broker/account specific.
-- This schema stores the exact values supplied by the authorized MT5/broker adapter.

UPDATE tenants
SET slug='edge-nexus', name='Edge Nexus', legal_name='Edge Nexus',
    branding='{"primary":"#12e995","accent":"#0b2132","product":"Edge Nexus","logo":null,"domain":null}'::jsonb,
    updated_at=now()
WHERE slug='hashnova';

INSERT INTO tenants(slug,name,legal_name,branding)
VALUES ('edge-nexus','Edge Nexus','Edge Nexus','{"primary":"#12e995","accent":"#0b2132","product":"Edge Nexus","logo":null,"domain":null}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

UPDATE users
SET tenant_id=(SELECT id FROM tenants WHERE slug='edge-nexus')
WHERE tenant_id=(SELECT id FROM tenants WHERE slug='hashnova')
   OR tenant_id IS NULL;

CREATE TABLE IF NOT EXISTS instrument_pricing (
  symbol TEXT PRIMARY KEY REFERENCES instruments(symbol) ON DELETE CASCADE,
  pricing_source TEXT NOT NULL DEFAULT 'mt5_adapter',
  spread_mode TEXT NOT NULL DEFAULT 'floating' CHECK (spread_mode IN ('floating','fixed','broker_feed')),
  spread_points NUMERIC(24,8),
  commission_type TEXT NOT NULL DEFAULT 'per_lot' CHECK (commission_type IN ('none','per_lot','percentage','per_side')),
  commission_value NUMERIC(24,8) NOT NULL DEFAULT 0,
  commission_currency CHAR(3) NOT NULL DEFAULT 'USD',
  swap_long NUMERIC(24,8) NOT NULL DEFAULT 0,
  swap_short NUMERIC(24,8) NOT NULL DEFAULT 0,
  swap_type TEXT NOT NULL DEFAULT 'points' CHECK (swap_type IN ('points','currency','percentage')),
  min_lot NUMERIC(18,8),
  max_lot NUMERIC(18,8),
  lot_step NUMERIC(18,8),
  contract_size NUMERIC(24,8),
  digits INTEGER,
  source_symbol TEXT,
  source_account TEXT,
  effective_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instrument_specs_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
  source TEXT NOT NULL,
  source_account TEXT,
  payload_hash TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted','rejected','partial')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instrument_specs_imports_tenant ON instrument_specs_imports(tenant_id,created_at DESC);

ALTER TABLE instruments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS trade_enabled BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS mt5_path TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS quote_currency CHAR(3);
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS price_source TEXT NOT NULL DEFAULT 'mt5_adapter';

-- Broad MT5-compatible catalog. Availability is ultimately controlled by the acquiring broker/MT5 server.
WITH seed(symbol,base_asset,quote_asset,asset_class,contract_size,min_lot,max_lot,lot_step,digits,description,mt5_path) AS (
VALUES
('EURUSD','EUR','USD','forex',100000,.01,100,.01,5,'Euro vs US Dollar','Forex\\Majors'),('GBPUSD','GBP','USD','forex',100000,.01,100,.01,5,'British Pound vs US Dollar','Forex\\Majors'),('USDJPY','USD','JPY','forex',100000,.01,100,.01,3,'US Dollar vs Japanese Yen','Forex\\Majors'),('USDCHF','USD','CHF','forex',100000,.01,100,.01,5,'US Dollar vs Swiss Franc','Forex\\Majors'),('AUDUSD','AUD','USD','forex',100000,.01,100,.01,5,'Australian Dollar vs US Dollar','Forex\\Majors'),('USDCAD','USD','CAD','forex',100000,.01,100,.01,5,'US Dollar vs Canadian Dollar','Forex\\Majors'),('NZDUSD','NZD','USD','forex',100000,.01,100,.01,5,'New Zealand Dollar vs US Dollar','Forex\\Majors'),
('EURGBP','EUR','GBP','forex',100000,.01,100,.01,5,'Euro vs British Pound','Forex\\Minors'),('EURJPY','EUR','JPY','forex',100000,.01,100,.01,3,'Euro vs Japanese Yen','Forex\\Minors'),('EURCHF','EUR','CHF','forex',100000,.01,100,.01,5,'Euro vs Swiss Franc','Forex\\Minors'),('EURAUD','EUR','AUD','forex',100000,.01,100,.01,5,'Euro vs Australian Dollar','Forex\\Minors'),('EURCAD','EUR','CAD','forex',100000,.01,100,.01,5,'Euro vs Canadian Dollar','Forex\\Minors'),('EURNZD','EUR','NZD','forex',100000,.01,100,.01,5,'Euro vs New Zealand Dollar','Forex\\Minors'),('GBPJPY','GBP','JPY','forex',100000,.01,100,.01,3,'British Pound vs Japanese Yen','Forex\\Minors'),('GBPCHF','GBP','CHF','forex',100000,.01,100,.01,5,'British Pound vs Swiss Franc','Forex\\Minors'),('GBPAUD','GBP','AUD','forex',100000,.01,100,.01,5,'British Pound vs Australian Dollar','Forex\\Minors'),('GBPCAD','GBP','CAD','forex',100000,.01,100,.01,5,'British Pound vs Canadian Dollar','Forex\\Minors'),('GBPNZD','GBP','NZD','forex',100000,.01,100,.01,5,'British Pound vs New Zealand Dollar','Forex\\Minors'),('AUDJPY','AUD','JPY','forex',100000,.01,100,.01,3,'Australian Dollar vs Japanese Yen','Forex\\Minors'),('AUDCAD','AUD','CAD','forex',100000,.01,100,.01,5,'Australian Dollar vs Canadian Dollar','Forex\\Minors'),('AUDNZD','AUD','NZD','forex',100000,.01,100,.01,5,'Australian Dollar vs New Zealand Dollar','Forex\\Minors'),('CADJPY','CAD','JPY','forex',100000,.01,100,.01,3,'Canadian Dollar vs Japanese Yen','Forex\\Minors'),('CADCHF','CAD','CHF','forex',100000,.01,100,.01,5,'Canadian Dollar vs Swiss Franc','Forex\\Minors'),('CHFJPY','CHF','JPY','forex',100000,.01,100,.01,3,'Swiss Franc vs Japanese Yen','Forex\\Minors'),('NZDJPY','NZD','JPY','forex',100000,.01,100,.01,3,'New Zealand Dollar vs Japanese Yen','Forex\\Minors'),('NZDCAD','NZD','CAD','forex',100000,.01,100,.01,5,'New Zealand Dollar vs Canadian Dollar','Forex\\Minors'),('NZDCHF','NZD','CHF','forex',100000,.01,100,.01,5,'New Zealand Dollar vs Swiss Franc','Forex\\Minors'),
('USDNOK','USD','NOK','forex',100000,.01,100,.01,5,'US Dollar vs Norwegian Krone','Forex\\Exotics'),('USDSEK','USD','SEK','forex',100000,.01,100,.01,5,'US Dollar vs Swedish Krona','Forex\\Exotics'),('USDDKK','USD','DKK','forex',100000,.01,100,.01,5,'US Dollar vs Danish Krone','Forex\\Exotics'),('USDPLN','USD','PLN','forex',100000,.01,100,.01,5,'US Dollar vs Polish Zloty','Forex\\Exotics'),('USDHUF','USD','HUF','forex',100000,.01,100,.01,5,'US Dollar vs Hungarian Forint','Forex\\Exotics'),('USDCZK','USD','CZK','forex',100000,.01,100,.01,5,'US Dollar vs Czech Koruna','Forex\\Exotics'),('USDTRY','USD','TRY','forex',100000,.01,100,.01,5,'US Dollar vs Turkish Lira','Forex\\Exotics'),('USDZAR','USD','ZAR','forex',100000,.01,100,.01,5,'US Dollar vs South African Rand','Forex\\Exotics'),('USDMXN','USD','MXN','forex',100000,.01,100,.01,5,'US Dollar vs Mexican Peso','Forex\\Exotics'),('USDSGD','USD','SGD','forex',100000,.01,100,.01,5,'US Dollar vs Singapore Dollar','Forex\\Exotics'),('USDHKD','USD','HKD','forex',100000,.01,100,.01,5,'US Dollar vs Hong Kong Dollar','Forex\\Exotics'),('USDTHB','USD','THB','forex',100000,.01,100,.01,5,'US Dollar vs Thai Baht','Forex\\Exotics'),('USDCNH','USD','CNH','forex',100000,.01,100,.01,5,'US Dollar vs Offshore Yuan','Forex\\Exotics'),('EURPLN','EUR','PLN','forex',100000,.01,100,.01,5,'Euro vs Polish Zloty','Forex\\Exotics'),('EURTRY','EUR','TRY','forex',100000,.01,100,.01,5,'Euro vs Turkish Lira','Forex\\Exotics'),('EURSEK','EUR','SEK','forex',100000,.01,100,.01,5,'Euro vs Swedish Krona','Forex\\Exotics'),('EURNOK','EUR','NOK','forex',100000,.01,100,.01,5,'Euro vs Norwegian Krone','Forex\\Exotics'),('GBPSEK','GBP','SEK','forex',100000,.01,100,.01,5,'British Pound vs Swedish Krona','Forex\\Exotics'),('GBPNOK','GBP','NOK','forex',100000,.01,100,.01,5,'British Pound vs Norwegian Krone','Forex\\Exotics'),
('XAUUSD','XAU','USD','metals',100,.01,100,.01,2,'Gold vs US Dollar','Metals'),('XAGUSD','XAG','USD','metals',5000,.01,100,.01,3,'Silver vs US Dollar','Metals'),('XPTUSD','XPT','USD','metals',100,.01,100,.01,2,'Platinum vs US Dollar','Metals'),('XPDUSD','XPD','USD','metals',100,.01,100,.01,2,'Palladium vs US Dollar','Metals'),('XAUEUR','XAU','EUR','metals',100,.01,100,.01,2,'Gold vs Euro','Metals'),('XAUGBP','XAU','GBP','metals',100,.01,100,.01,2,'Gold vs British Pound','Metals'),
('USOIL','USO','USD','energy',1000,.01,100,.01,2,'US Crude Oil','Energies'),('UKOIL','UKO','USD','energy',1000,.01,100,.01,2,'Brent Crude Oil','Energies'),('NGAS','NG','USD','energy',10000,.01,100,.01,3,'Natural Gas','Energies'),('GASOLINE','RB','USD','energy',42000,.01,100,.01,4,'RBOB Gasoline','Energies'),('HEATOIL','HO','USD','energy',42000,.01,100,.01,4,'Heating Oil','Energies'),('BRENT','BRN','USD','energy',1000,.01,100,.01,2,'Brent Crude','Energies'),('WTI','WTI','USD','energy',1000,.01,100,.01,2,'WTI Crude','Energies'),('COCOA','CC','USD','commodity',10,.01,100,.01,2,'Cocoa','Commodities'),('COFFEE','KC','USD','commodity',37500,.01,100,.01,2,'Coffee','Commodities'),('CORN','ZC','USD','commodity',5000,.01,100,.01,2,'Corn','Commodities'),('WHEAT','ZW','USD','commodity',5000,.01,100,.01,2,'Wheat','Commodities'),('SOYBEAN','ZS','USD','commodity',5000,.01,100,.01,2,'Soybean','Commodities'),('SUGAR','SB','USD','commodity',112000,.01,100,.01,4,'Sugar','Commodities'),
('US30','US30','USD','index',1,.01,100,.01,2,'US Wall Street 30','Indices'),('US500','US500','USD','index',1,.01,100,.01,2,'US S&P 500','Indices'),('USTEC','USTEC','USD','index',1,.01,100,.01,2,'US Nasdaq 100','Indices'),('US2000','US2000','USD','index',1,.01,100,.01,2,'US Russell 2000','Indices'),('GER40','GER40','EUR','index',1,.01,100,.01,2,'Germany 40','Indices'),('UK100','UK100','GBP','index',1,.01,100,.01,2,'UK 100','Indices'),('FRA40','FRA40','EUR','index',1,.01,100,.01,2,'France 40','Indices'),('EU50','EU50','EUR','index',1,.01,100,.01,2,'Euro Stoxx 50','Indices'),('ESP35','ESP35','EUR','index',1,.01,100,.01,2,'Spain 35','Indices'),('ITA40','ITA40','EUR','index',1,.01,100,.01,2,'Italy 40','Indices'),('AUS200','AUS200','AUD','index',1,.01,100,.01,2,'Australia 200','Indices'),('JPN225','JPN225','JPY','index',1,.01,100,.01,2,'Japan 225','Indices'),('HK50','HK50','HKD','index',1,.01,100,.01,2,'Hong Kong 50','Indices'),('CH20','CH20','CHF','index',1,.01,100,.01,2,'Switzerland 20','Indices'),('NETH25','NETH25','EUR','index',1,.01,100,.01,2,'Netherlands 25','Indices'),('SA40','SA40','ZAR','index',1,.01,100,.01,2,'South Africa 40','Indices'),('SG20','SG20','SGD','index',1,.01,100,.01,2,'Singapore 20','Indices'),('CN50','CN50','USD','index',1,.01,100,.01,2,'China 50','Indices'),('DOLLAR','DXY','USD','index',1,.01,100,.01,3,'US Dollar Index','Indices'),
('BTCUSD','BTC','USD','crypto',1,.01,100,.01,2,'Bitcoin vs US Dollar','Crypto'),('ETHUSD','ETH','USD','crypto',1,.01,100,.01,2,'Ethereum vs US Dollar','Crypto'),('LTCUSD','LTC','USD','crypto',1,.01,100,.01,2,'Litecoin vs US Dollar','Crypto'),('XRPUSD','XRP','USD','crypto',1,.01,100,.01,5,'XRP vs US Dollar','Crypto'),('BCHUSD','BCH','USD','crypto',1,.01,100,.01,2,'Bitcoin Cash vs US Dollar','Crypto'),('ADAUSD','ADA','USD','crypto',1,.01,100,.01,5,'Cardano vs US Dollar','Crypto'),('SOLUSD','SOL','USD','crypto',1,.01,100,.01,3,'Solana vs US Dollar','Crypto'),('DOTUSD','DOT','USD','crypto',1,.01,100,.01,4,'Polkadot vs US Dollar','Crypto'),('DOGEUSD','DOGE','USD','crypto',1,.01,100,.01,6,'Dogecoin vs US Dollar','Crypto'),('AVAXUSD','AVAX','USD','crypto',1,.01,100,.01,4,'Avalanche vs US Dollar','Crypto'),('LINKUSD','LINK','USD','crypto',1,.01,100,.01,4,'Chainlink vs US Dollar','Crypto'),('UNIUSD','UNI','USD','crypto',1,.01,100,.01,4,'Uniswap vs US Dollar','Crypto'),('XLMUSD','XLM','USD','crypto',1,.01,100,.01,5,'Stellar vs US Dollar','Crypto'),('TRXUSD','TRX','USD','crypto',1,.01,100,.01,5,'TRON vs US Dollar','Crypto'),('MATICUSD','MATIC','USD','crypto',1,.01,100,.01,5,'Polygon vs US Dollar','Crypto'),
('AAPL','AAPL','USD','stock',1,.01,1000,.01,2,'Apple Inc.','Stocks'),('MSFT','MSFT','USD','stock',1,.01,1000,.01,2,'Microsoft Corp.','Stocks'),('NVDA','NVDA','USD','stock',1,.01,1000,.01,2,'NVIDIA Corp.','Stocks'),('AMZN','AMZN','USD','stock',1,.01,1000,.01,2,'Amazon.com Inc.','Stocks'),('GOOGL','GOOGL','USD','stock',1,.01,1000,.01,2,'Alphabet Inc.','Stocks'),('META','META','USD','stock',1,.01,1000,.01,2,'Meta Platforms','Stocks'),('TSLA','TSLA','USD','stock',1,.01,1000,.01,2,'Tesla Inc.','Stocks'),('NFLX','NFLX','USD','stock',1,.01,1000,.01,2,'Netflix Inc.','Stocks'),('AMD','AMD','USD','stock',1,.01,1000,.01,2,'Advanced Micro Devices','Stocks'),('INTC','INTC','USD','stock',1,.01,1000,.01,2,'Intel Corp.','Stocks'),('JPM','JPM','USD','stock',1,.01,1000,.01,2,'JPMorgan Chase','Stocks'),('V','V','USD','stock',1,.01,1000,.01,2,'Visa Inc.','Stocks'),('MA','MA','USD','stock',1,.01,1000,.01,2,'Mastercard Inc.','Stocks'),('BA','BA','USD','stock',1,.01,1000,.01,2,'Boeing Co.','Stocks'),('DIS','DIS','USD','stock',1,.01,1000,.01,2,'Walt Disney Co.','Stocks'),('KO','KO','USD','stock',1,.01,1000,.01,2,'Coca-Cola Co.','Stocks'),('PEP','PEP','USD','stock',1,.01,1000,.01,2,'PepsiCo Inc.','Stocks'),('NKE','NKE','USD','stock',1,.01,1000,.01,2,'Nike Inc.','Stocks'),('ORCL','ORCL','USD','stock',1,.01,1000,.01,2,'Oracle Corp.','Stocks'),('IBM','IBM','USD','stock',1,.01,1000,.01,2,'IBM Corp.','Stocks'),('CRM','CRM','USD','stock',1,.01,1000,.01,2,'Salesforce Inc.','Stocks'),('UBER','UBER','USD','stock',1,.01,1000,.01,2,'Uber Technologies','Stocks'),('PYPL','PYPL','USD','stock',1,.01,1000,.01,2,'PayPal Holdings','Stocks'),('BABA','BABA','USD','stock',1,.01,1000,.01,2,'Alibaba Group','Stocks'),('TCS','TCS','USD','stock',1,.01,1000,.01,2,'Tata Consultancy Services','Stocks'),('SHOP','SHOP','USD','stock',1,.01,1000,.01,2,'Shopify Inc.','Stocks'),('PLTR','PLTR','USD','stock',1,.01,1000,.01,2,'Palantir Technologies','Stocks'),('COIN','COIN','USD','stock',1,.01,1000,.01,2,'Coinbase Global','Stocks'),('MCD','MCD','USD','stock',1,.01,1000,.01,2,'McDonald’s Corp.','Stocks'),('WMT','WMT','USD','stock',1,.01,1000,.01,2,'Walmart Inc.','Stocks')
)
INSERT INTO instruments(symbol,base_asset,quote_asset,asset_class,contract_size,min_lot,max_lot,lot_step,digits,description,mt5_path,quote_currency)
SELECT symbol,base_asset,quote_asset,asset_class,contract_size,min_lot,max_lot,lot_step,digits,description,mt5_path,quote_asset FROM seed
ON CONFLICT (symbol) DO UPDATE SET description=EXCLUDED.description,mt5_path=EXCLUDED.mt5_path,quote_currency=EXCLUDED.quote_currency,asset_class=EXCLUDED.asset_class;

INSERT INTO instrument_pricing(symbol,pricing_source,spread_mode,commission_type,commission_value,commission_currency,swap_long,swap_short,swap_type,min_lot,max_lot,lot_step,contract_size,digits,source_symbol)
SELECT symbol,'mt5_adapter','broker_feed','per_lot',0,'USD',0,0,'points',min_lot,max_lot,lot_step,contract_size,digits,symbol FROM instruments
ON CONFLICT (symbol) DO NOTHING;

-- Seed the existing demo quotes for the symbols we already simulated; all other symbols remain quote-pending until the MT5/LP adapter supplies them.
UPDATE market_quotes SET ts=now() WHERE symbol IN ('EURUSD','GBPUSD','USDJPY','XAUUSD','AUDUSD');
