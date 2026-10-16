// Broker-neutral execution gateway. Production adapters plug in here.
export class ExecutionGateway {
  constructor({ mt5 }) { this.mt5 = mt5; }
  async quote(symbol) { return this.mt5.getQuote(symbol); }
  async placeMarketOrder({ symbol, side, quantity, account }) {
    return this.mt5.executeMarket({ symbol, side, quantity, account });
  }
  async closePosition({ symbol, side, quantity, account }) {
    const closeSide = side === 'long' ? 'sell' : 'buy';
    return this.mt5.executeMarket({ symbol, side: closeSide, quantity, account });
  }
  async syncAccount(account) { return this.mt5.syncAccount(account); }
  async syncOrders(account) { return this.mt5.syncOrders(account); }
  async syncPositions(account) { return this.mt5.syncPositions(account); }
}
