# Kinetic Academy

Kinetic Academy is an AI-powered cognitive university admission preparation platform for Bangladesh. It combines Duolingo-style motivation with deeper learning loops: Feynman explanation checks, Socratic reasoning defense, first-principles reconstruction, battle simulations, mentor/event discovery, and a persistent Kino AI assistant.

## Stack

- Next.js App Router, React 19, TypeScript
- Tailwind CSS, shadcn-compatible primitives, Framer Motion
- PostgreSQL with Prisma ORM
- JWT-ready auth, SMS OTP primitives, Google OAuth readiness
- Google Gemini via `@google/genai`, always called server-side
- Zod validation, API envelopes, rate limiting, structured logger

## Quick Start

```bash
corepack enable
corepack pnpm install
Copy-Item .env.example .env
docker compose up -d
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm dev
```

Open `http://localhost:3000` and you will be routed into the protected app flow.

## Environment Variables

See `.env.example` for the complete list.

Important production variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `SMS_USE_MOCK=false`
- `SMS_GATEWAY_URL`
- `SMS_API_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`

If `GEMINI_API_KEY` is blank, the app uses deterministic local cognitive rubrics so development remains fully functional without exposing or faking external credentials.

## Scripts

```bash
corepack pnpm dev              # Local dev server
corepack pnpm build            # Production build
corepack pnpm start            # Start built app
corepack pnpm lint             # ESLint
corepack pnpm typecheck        # TypeScript
corepack pnpm prisma:validate  # Prisma schema validation
corepack pnpm db:generate      # Generate Prisma client
corepack pnpm db:migrate       # Apply local DB migrations
corepack pnpm db:seed          # Seed curriculum and prompts
```

## Project Structure

```text
src/
  app/
    api/
      ai/                 # Gemini-backed cognitive APIs
      auth/               # OTP, Google OAuth, logout, me
    demo/                 # Preserved standalone prototype route
    page.tsx              # Production Kinetic Academy shell
  features/
    academy/              # Main product UI and learning data
    demo/                 # Earlier lightweight demo
  lib/
    ai/                   # Gemini adapter, schemas, local rubrics
    api/                  # Response envelopes
    auth/                 # OTP, JWT session, RBAC
    config/               # Environment and app constants
    db/                   # Prisma singleton
    rate-limit/           # In-memory MVP limiter
    sms/                  # Mock and HTTP SMS adapters
prisma/
  schema.prisma           # Relational product model
  seed.ts                 # Exam targets and prompt versions
docs/
  API.md
  DEPLOYMENT.md
SKILL.md
```

## AI API Routes

- `POST /api/ai/feynman`
- `POST /api/ai/socratic`
- `POST /api/ai/socratic/evaluate`
- `POST /api/ai/first-principles`
- `POST /api/ai/chat`

Full contracts are documented in `docs/API.md`.

## Deployment

See `docs/DEPLOYMENT.md` for Docker, VPS, CI/CD, security checklist, scaling plan, and cost controls.
