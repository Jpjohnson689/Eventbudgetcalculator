# OneBridge AaaS Monorepo

AaaS (Agent as a Service) internal delivery platform for OneBridge Labs.

## Monorepo layout

- `api`: Node.js + Express + TypeScript API, Prisma/Postgres data layer, Redis queue, Claude orchestration.
- `admin`: React + Vite + Tailwind admin dashboard.
- `widget`: Vanilla JS embeddable widget bundle.

## Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for Postgres + Redis)

## Local setup

1. Start infrastructure:

```bash
docker compose up -d postgres redis
```

2. Install dependencies and generate Prisma client:

```bash
pnpm install
pnpm --filter @aaas/api prisma:generate
```

3. Configure environment:

```bash
cp api/.env.example api/.env
```

4. Apply migrations and seed data:

```bash
pnpm --filter @aaas/api prisma:migrate
pnpm --filter @aaas/api prisma:seed
```

5. Start all services:

```bash
pnpm dev
```

- API: http://localhost:4000
- Admin: http://localhost:5173
- Widget bundle: `widget/dist/index.global.js`

## Deploy

### Frontend (Vercel)

```bash
vercel --prod
```

### Backend (Railway)

```bash
railway up
```

## Client onboarding runbook (under 60 mins)

1. **Create client workspace** from Admin > Clients.
2. **Create agent** with system prompt, model, temperature, tool list, and limits.
3. **Attach knowledge** via `/admin/knowledge/upload`.
4. **Generate embed snippet**:

```html
<div id="ob-agent"></div>
<script src="https://cdn.yourdomain.com/widget/index.global.js"></script>
<script>
  window.OneBridgeWidget.mount('#ob-agent', {
    apiBase: 'https://api.yourdomain.com',
    agentKey: 'client_agent_key',
    theme: 'light'
  });
</script>
```

5. Validate session persistence by reloading the page and confirming conversation continuity.

## Cost query examples

```sql
SELECT c.name, SUM(cl."amountUsd") AS total_cost
FROM "CostLog" cl
JOIN "Client" c ON c.id = cl."clientId"
GROUP BY c.name
ORDER BY total_cost DESC;
```

## End-to-end smoke test flow

1. Create client and agent in admin UI.
2. Embed widget in a static HTML page.
3. Send a message; verify API returns run response.
4. Check `CostLog` rows for the client.
5. Reload page and confirm session id is reused from local storage.

## Assumptions noted in code

- If `ANTHROPIC_API_KEY` is absent, orchestrator uses deterministic mock response for local testing.
- Knowledge embeddings are placeholder zero vectors in local upload route for v1 scaffolding.
