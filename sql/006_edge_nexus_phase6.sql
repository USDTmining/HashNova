-- Edge Nexus Phase 6: demo/real account separation + broader markets
UPDATE tenants SET slug='edge-nexus', name='Edge Nexus', legal_name='Edge Nexus', branding='{"primary":"#12e995","accent":"#0b2132","product":"Edge Nexus","logo":null,"domain":null}'::jsonb WHERE slug='hashnova';

ALTER TABLE trading_accounts ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'real' CHECK (account_type IN ('demo','real'));
UPDATE trading_accounts SET account_type='demo' WHERE account_type IS NULL;
UPDATE trading_accounts SET account_type='demo', balance=10000, equity=10000, margin_available=10000 WHERE account_type='real' AND balance=0;
CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_type ON trading_accounts(user_id,account_type);

-- Demo accounts are isolated from the real-money wallet/ledger. A demo reset always returns to USD 10,000.

WITH seed(symbol,base_asset,quote_asset,asset_class,contract_size,min_lot,max_lot,lot_step,digits,description,mt5_path) AS (
VALUES
('US30','US30','USD','index',1,0.01,100,0.01,2,'US Wall Street 30','Indices\\US30'),
('US500','US500','USD','index',1,0.01,100,0.01,2,'US 500','Indices\\US500'),
('NAS100','NAS100','USD','index',1,0.01,100,0.01,2,'US Tech 100','Indices\\NAS100'),
('GER40','GER40','EUR','index',1,0.01,100,0.01,2,'Germany 40','Indices\\GER40'),
('UK100','UK100','GBP','index',1,0.01,100,0.01,2,'UK 100','Indices\\UK100'),
('JPN225','JPN225','JPY','index',1,0.01,100,0.01,0,'Japan 225','Indices\\JPN225'),
('HK50','HK50','HKD','index',1,0.01,100,0.01,1,'Hong Kong 50','Indices\\HK50'),
('AAPL','AAPL','USD','stock',1,0.01,1000,0.01,2,'Apple Inc.','Stocks\\AAPL'),
('MSFT','MSFT','USD','stock',1,0.01,1000,0.01,2,'Microsoft Corp.','Stocks\\MSFT'),
('AMZN','AMZN','USD','stock',1,0.01,1000,0.01,2,'Amazon.com Inc.','Stocks\\AMZN'),
('NVDA','NVDA','USD','stock',1,0.01,1000,0.01,2,'NVIDIA Corp.','Stocks\\NVDA'),
('TSLA','TSLA','USD','stock',1,0.01,1000,0.01,2,'Tesla Inc.','Stocks\\TSLA'),
('META','META','USD','stock',1,0.01,1000,0.01,2,'Meta Platforms','Stocks\\META'),
('SPY','SPY','USD','etf',1,0.01,1000,0.01,2,'SPDR S&P 500 ETF','ETFs\\SPY'),
('QQQ','QQQ','USD','etf',1,0.01,1000,0.01,2,'Invesco QQQ','ETFs\\QQQ'),
('IWM','IWM','USD','etf',1,0.01,1000,0.01,2,'iShares Russell 2000 ETF','ETFs\\IWM'),
('TLT','TLT','USD','etf',1,0.01,1000,0.01,2,'iShares 20+ Year Treasury ETF','ETFs\\TLT'),
('US10Y','US10Y','USD','bond',1000,0.01,100,0.01,3,'US 10Y Treasury benchmark','Bonds\\US10Y'),
('DE10Y','DE10Y','EUR','bond',1000,0.01,100,0.01,3,'Germany 10Y Treasury benchmark','Bonds\\DE10Y'),
('USOIL','USOIL','USD','energy',100,0.01,100,0.01,2,'US Crude Oil','Energies\\USOIL'),
('UKOIL','UKOIL','USD','energy',100,0.01,100,0.01,2,'Brent Crude Oil','Energies\\UKOIL'),
('NATGAS','NATGAS','USD','energy',1000,0.01,100,0.01,3,'Natural Gas','Energies\\NATGAS'),
('XAGUSD','XAG','USD','metals',5000,0.01,100,0.01,3,'Silver','Metals\\XAGUSD'),
('XPTUSD','XPT','USD','metals',50,0.01,100,0.01,2,'Platinum','Metals\\XPTUSD'),
('XPDUSD','XPD','USD','metals',50,0.01,100,0.01,2,'Palladium','Metals\\XPDUSD'),
('BTCUSD','BTC','USD','crypto',1,0.01,100,0.01,2,'Bitcoin','Crypto\\BTCUSD'),
('ETHUSD','ETH','USD','crypto',1,0.01,100,0.01,2,'Ethereum','Crypto\\ETHUSD'),
('LTCUSD','LTC','USD','crypto',1,0.01,100,0.01,2,'Litecoin','Crypto\\LTCUSD'),
('BCHUSD','BCH','USD','crypto',1,0.01,100,0.01,2,'Bitcoin Cash','Crypto\\BCHUSD'),
('CORN','CORN','USD','commodity',5000,0.01,100,0.01,2,'Corn','Commodities\\CORN'),
('WHEAT','WHEAT','USD','commodity',5000,0.01,100,0.01,2,'Wheat','Commodities\\WHEAT'),
('COFFEE','COFFEE','USD','commodity',37500,0.01,100,0.01,2,'Coffee','Commodities\\COFFEE'),
('COCOA','COCOA','USD','commodity',10,0.01,100,0.01,2,'Cocoa','Commodities\\COCOA')
)
INSERT INTO instruments(symbol,base_asset,quote_asset,asset_class,contract_size,min_lot,max_lot,lot_step,digits,description,mt5_path,quote_currency)
SELECT symbol,base_asset,quote_asset,asset_class,contract_size,min_lot,max_lot,lot_step,digits,description,mt5_path,quote_asset FROM seed
ON CONFLICT(symbol) DO UPDATE SET asset_class=EXCLUDED.asset_class,description=EXCLUDED.description,mt5_path=EXCLUDED.mt5_path,quote_currency=EXCLUDED.quote_currency,contract_size=EXCLUDED.contract_size;

INSERT INTO instrument_pricing(symbol,pricing_source,spread_mode,commission_type,commission_value,commission_currency,swap_long,swap_short,swap_type,min_lot,max_lot,lot_step,contract_size,digits,source_symbol)
SELECT symbol,'mt5_adapter','broker_feed','broker_profile',0,'USD',0,0,'broker_profile',min_lot,max_lot,lot_step,contract_size,digits,symbol FROM instruments
ON CONFLICT(symbol) DO NOTHING;
