// Broker-neutral market adapter. Replace this implementation with a licensed LP/FIX/MT5 feed.
export class DemoMarketAdapter {
  constructor(pool) { this.pool = pool; }
  async getQuotes() {
    const { rows } = await this.pool.query(`SELECT symbol,bid,ask,ts FROM market_quotes ORDER BY symbol`);
    return rows;
  }
  async getQuote(symbol) {
    const { rows } = await this.pool.query(`SELECT symbol,bid,ask,ts FROM market_quotes WHERE symbol=$1`, [symbol]);
    return rows[0] || null;
  }
  async executeMarket({ symbol, side }) {
    const quote = await this.getQuote(symbol);
    if (!quote) throw new Error('Instrument quote unavailable');
    return { price: Number(side === 'buy' ? quote.ask : quote.bid), liquidityProvider: process.env.MT5_BRIDGE_NAME || 'DEMO_FEED' };
  }
}
