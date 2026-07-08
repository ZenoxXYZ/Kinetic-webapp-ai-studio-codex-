# Deployment Guide

## Production Architecture

Kinetic Academy runs as a Next.js application with server-side route handlers and a PostgreSQL database.

Recommended production shape:

- Cloudflare in front for DNS, TLS, CDN, and WAF.
- Dockerized Next.js application on a VPS or container host.
- Managed PostgreSQL for production.
- Redis before scale-out for distributed rate limiting and sessions.
- Log aggregation through Better Stack, Datadog, Grafana Cloud, or OpenTelemetry collector.

## Docker Local Setup

```bash
docker compose up -d
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm build
corepack pnpm start
```

## VPS Deployment

1. Provision Ubuntu 24.04 LTS.
2. Install Docker, Docker Compose, Node 22 LTS, and Corepack.
3. Clone the repository.
4. Create `.env` from `.env.example`.
5. Set production secrets and run the app with a production Node runtime:
   - `NEXT_PUBLIC_APP_URL=https://your-domain.com`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `SMS_USE_MOCK=false`
   - `SMS_GATEWAY_URL`
   - `SMS_API_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GEMINI_API_KEY`
6. Run:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm db:generate
corepack pnpm build
corepack pnpm start
```

Use `systemd` or Docker Compose to keep the process alive.

## CI/CD Pipeline

Recommended GitHub Actions steps:

```yaml
name: CI
on:
  push:
    branches: [main, master]
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 11.1.1
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm prisma:validate
      - run: pnpm build
```

Deployment can be a second job that SSHes into the VPS, pulls the repository, installs dependencies, runs migrations, builds, and restarts the app service.

## Scaling Strategy

- Replace in-memory rate limits with Redis.
- Move analytics and AI interaction logs into append-only event tables or ClickHouse.
- Cache static curriculum JSON at the edge.
- Keep Gemini calls server-side and add request queueing during exam-season spikes.
- Add WebSockets or Liveblocks/Ably/Pusher for real battle lobbies.
- Split mentor booking/payment into an isolated service once money movement begins.

## Cost Optimization

- Use deterministic local rubric for dev and preview branches.
- Cache repeated Socratic chains by topic/context hash.
- Store AI input/output hashes to avoid duplicate paid calls.
- Use Gemini Flash models for short grading tasks.
- Cap answer length at the API boundary.
- Add daily AI quota by subscription tier.

## Security Checklist

- Never expose `GEMINI_API_KEY` to the client.
- Rotate `JWT_SECRET` with a planned session invalidation window.
- Use `SMS_USE_MOCK=false` only with real provider credentials in production.
- Run the server in production mode so HTTPS-only cookies are enabled.
- Add Redis-backed IP and user rate limits before multi-instance deploy.
- Validate every route body with Zod.
- Keep Prisma migrations reviewed in pull requests.
- Add audit logs for auth, payment, mentor booking, and admin operations.

## Monitoring

Track:

- API latency by route.
- AI provider errors and fallback frequency.
- OTP request/verify success rate.
- Sign-in conversion.
- Feynman pass rate by topic.
- Energy spend per session.
- Battle starts/completions.
- Mentor booking clicks and waitlist conversion.

## Rollback Plan

1. Keep the previous Docker image or Git SHA available.
2. Deploy schema migrations in backward-compatible phases.
3. If a deploy fails, restart the previous app image.
4. If AI provider errors spike, leave `GEMINI_API_KEY` set but route to local rubric with a feature flag in a future release.
