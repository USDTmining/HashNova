# Deployment

## Local

This API expects Node 20+ and PostgreSQL 15+.

```bash
cd server
cp .env.example .env
npm install
psql "$DATABASE_URL" -f ../sql/001_init.sql
psql "$DATABASE_URL" -f ../sql/002_forex.sql
psql "$DATABASE_URL" -f ../sql/003_broker_ops.sql
npm start
```

The API also serves the frontend, so open `http://localhost:8080/` after starting it.

## Production

Use a managed PostgreSQL service and TLS termination at a reverse proxy/load balancer. Store `SESSION_SECRET` and `WEBHOOK_SECRET` in a secrets manager. Set `NODE_ENV=production`, restrict database network access, configure backups/PITR, and add centralized logging/metrics.

For a Forex buyer, run the trading engine/risk services separately from the client portal API. The portal should request authoritative account state and never calculate executable prices, margin calls, or settlement results on the client.
