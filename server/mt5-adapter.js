// MT5 adapter boundary. This implementation is intentionally broker-neutral.
// Connect it to an authorized MT5 Manager/API bridge, gateway, or broker service.
export class MT5Adapter {
  constructor(pool) { this.pool = pool; }
  async getInstrumentUniverse({ assetClass = null } = {}) {
    const params = []; let where = 'i.enabled=true';
    if (assetClass) { params.push(assetClass); where += ` AND i.asset_class=$${params.length}`; }
    const { rows } = await this.pool.query(`
      SELECT i.symbol,i.description,i.asset_class,i.base_asset,i.quote_asset,i.contract_size,i.min_lot,i.max_lot,i.lot_step,i.digits,i.mt5_path,i.trade_enabled,
      p.pricing_source,p.spread_mode,p.spread_points,p.commission_type,p.commission_value,p.commission_currency,p.swap_long,p.swap_short,p.swap_type,
      p.source_symbol,p.source_account,p.effective_at FROM instruments i LEFT JOIN instrument_pricing p ON p.symbol=i.symbol
      WHERE ${where} ORDER BY i.asset_class,i.symbol`, params);
    return rows;
  }
  async getQuote(symbol) { return (await this.pool.query(`SELECT symbol,bid,ask,ts FROM market_quotes WHERE symbol=$1`, [symbol])).rows[0] || null; }
  async getQuotes() { return (await this.pool.query(`SELECT q.symbol,q.bid,q.ask,q.ts,i.asset_class FROM market_quotes q JOIN instruments i ON i.symbol=q.symbol WHERE i.enabled=true ORDER BY q.symbol`)).rows; }
  async executeMarket({ symbol, side }) {
    const quote = await this.getQuote(symbol);
    if (!quote) throw new Error('Instrument quote unavailable');
    return { price: Number(side === 'buy' ? quote.ask : quote.bid), liquidityProvider: process.env.MT5_BRIDGE_NAME || 'MT5_ADAPTER_PENDING', brokerOrderId: null };
  }
  async syncAccount(account) { return { status: 'not_connected', externalAccountId: account.external_account_id || null }; }
  async syncOrders() { return { status: 'not_connected', orders: [] }; }
  async syncPositions() { return { status: 'not_connected', positions: [] }; }
}
