# Kinetic Academy Skill Guide

## Product Overview

Kinetic Academy is an AI-native cognitive admission preparation platform for Bangladeshi students. It targets high-pressure university admissions and STEM/ICT preparation by replacing passive memorization with active explanation, reasoning defense, first-principles reconstruction, and gamified motivation loops.

## Vision

The product should feel like Duolingo motivation plus Brilliant-style interaction plus a serious Bangladeshi admission mentor. Students should not merely tap MCQs. They should explain, defend, reconstruct, battle, and receive targeted feedback.

## Architecture

- `src/app` contains Next.js App Router pages and route handlers.
- `src/features/academy` contains the production product surface.
- `src/app/demo` contains the standalone pitch demo and should stay available.
- `src/lib/ai` contains all cognitive AI logic, schemas, Gemini integration, and local deterministic rubrics.
- `src/lib/auth` contains OTP, JWT session, and RBAC primitives.
- `src/lib/api` contains response envelopes.
- `src/lib/config` validates environment variables with Zod.
- `prisma/schema.prisma` is the source of truth for product data.

## Feature Breakdown

### Learning Lab

The Learning Lab has five steps:

1. Explanation: concept summary, definitions, and core mechanism.
2. Sandbox: dynamic examples showing input, output, and annotations.
3. Feynman: typed or voice explanation evaluated by AI/local rubric.
4. Socratic: five progressive reasoning questions.
5. First Principles: axiom fields checked against a claim.

### Feynman Evaluator

API: `POST /api/ai/feynman`

Function flow:

1. Validate request with `feynmanRequestSchema`.
2. Rate-limit by IP.
3. Call `evaluateFeynman`.
4. If `GEMINI_API_KEY` exists, use `@google/genai` server-side.
5. If not, use deterministic keyword/clarity/example rubric.
6. Return structured JSON with score, gaps, misconceptions, Bangla feedback, and status.

### Socratic Interrogator

APIs:

- `POST /api/ai/socratic`
- `POST /api/ai/socratic/evaluate`

The generator always returns five questions:

1. Core existence.
2. Under-the-hood mechanics.
3. Critical failure states.
4. Alternative tradeoffs.
5. Boundary scenarios.

The evaluator scores causal reasoning, mechanism, and defense quality.

### First-Principles Checker

API: `POST /api/ai/first-principles`

Students must break a claim into axioms. The checker identifies passed axioms, missing axioms, synthesis quality, and pass status.

### Battle Arena

The current implementation is a complete simulated 1v1 clash suitable for MVP validation. The Prisma schema includes `Battle`, `BattleResult`, and opponent relations so this can evolve into live WebSocket matchmaking.

### Mentorship Hub and Events

The UI lists verified mentors and event cards. The schema includes `Event` and `EventRegistration`, enabling waitlists, paid workshops, olympiads, and mentor live sessions.

### Kino AI Assistant

API: `POST /api/ai/chat`

Kino receives message, active topic, and workspace state. It returns a concise mentor-style reply and a suggested next action.

## Database Schema Explanation

Core models:

- `User`: identity, role, subscription tier, auth relations, learning, gamification, AI usage.
- `StudentProfile`: exam target, exam date, prep level, topic energy.
- `ExamTarget`, `Subject`, `Chapter`, `Topic`: curriculum hierarchy.
- `Question`, `QuestionOption`, `QuestionAttempt`: MCQ practice primitives.
- `PromptVersion`, `AiInteraction`: prompt versioning and AI observability.
- `AssessmentRecord`: Feynman, Socratic, and first-principles mastery per user/topic.
- `LearningProgress`: unlock state, XP, energy spent per topic.
- `Battle`: 1v1 duel records.
- `Event`, `EventRegistration`: olympiads, workshops, mentor lives.
- `MentorProfile`: verified mentor metadata and pricing.
- `XpLedger`, `StreakLedger`, `Achievement`: gamification primitives.
- `AuditLog`: security and compliance trace.

## Authentication Flow

1. Student requests OTP with Bangladesh phone number.
2. OTP is generated, hashed, stored with expiry and attempt count.
3. SMS adapter sends via mock or real HTTP gateway.
4. Verification enforces expiry and max attempts.
5. User is created or updated.
6. JWT session cookie is set as HTTP-only, secure in production, SameSite strict.
7. RBAC helpers gate protected route handlers.

## AI Workflow

The AI layer uses two tiers:

- Production provider: Google Gemini via `@google/genai`.
- Development fallback: deterministic cognitive rubric.

This keeps local development and demos reliable while preserving a real production AI path. Gemini responses are requested as `application/json` with response schemas, then parsed and validated with Zod.

## Security Architecture

- Environment validation at startup.
- Server-only AI keys.
- Zod validation on all AI/auth route bodies.
- Standard API envelope.
- In-memory MVP rate limiter.
- JWT cookies are HTTP-only and secure in production.
- OTP hashes use bcrypt plus pepper.
- Prisma protects DB access through typed queries.

## State Management

The current product shell uses local React state because the first production surface is single-user and route-local. Zustand is available for cross-route state once persisted onboarding, subscriptions, and live battles are introduced.

## UI/UX Philosophy

- Dark navy base with electric blue, green wins, red urgency, and gold rewards.
- Rounded cards and high-contrast typography.
- Motion should reward progress, not distract.
- Students should always know the next action.
- Product copy uses Bangla/Banglish where it lowers cognitive friction.

## Accessibility

- Buttons use real button elements.
- Inputs have visible placeholders and focus states.
- Color contrast targets WCAG AA.
- Voice input has typed fallback.
- Animations are short and task-relevant.

## SEO Strategy

- Root metadata describes AI-native admission prep.
- Future content pages should be server-rendered for topics such as IBA preparation, HSC ICT, Python basics, and BUET admission logic.
- Add structured data for courses and events when public marketing pages launch.

## Analytics Strategy

Track:

- Topic start/completion.
- Feynman score distribution.
- Socratic question generation and pass rate.
- First-principles score.
- Battle start/completion.
- Mentor booking intent.
- Event waitlist conversion.
- AI fallback frequency.

## Logging and Monitoring

Use the logger abstraction today. Before production launch, forward logs to a hosted collector and add route latency, Gemini latency, OTP success rate, and DB error dashboards.

## Testing Strategy

Required tests:

- Environment validation.
- OTP lifecycle.
- JWT signing/verification.
- RBAC helpers.
- AI local rubric edge cases.
- API validation errors.
- Learning Lab render path.
- Demo navigation smoke test.

## Performance Strategy

- Keep AI calls server-side and bounded by max input length.
- Lazy-load heavier future modules.
- Cache static curriculum data.
- Use provider response caching by input hash.
- Replace in-memory rate limit with Redis before horizontal scaling.

## Deployment Guide

Use `docs/DEPLOYMENT.md` for VPS, Docker, CI/CD, scaling, cost, and security guidance.

## Developer Onboarding

1. Install Node 22 and Corepack.
2. Run `corepack pnpm install`.
3. Copy `.env.example` to `.env`.
4. Start Postgres with Docker Compose.
5. Run Prisma generate, migrate, and seed.
6. Run `corepack pnpm dev`.
7. Visit `/` for the production shell.

## Contribution Guidelines

- Keep product modules inside `src/features`.
- Keep shared infrastructure inside `src/lib`.
- Never read `process.env` directly outside config modules.
- Validate API input with Zod.
- Return standard API envelopes.
- Keep AI prompts versionable and server-side.
- Do not place secrets in client components.
- Run lint, typecheck, Prisma validate, and build before pushing.

## Scaling Roadmap

1. Redis rate limits and queues.
2. AI interaction persistence and cache.
3. Live WebSocket battle lobbies.
4. Mentor booking/payment system.
5. Admin CMS for curriculum.
6. Mobile app shell with Capacitor or React Native.
7. RAG layer from NCTB and admission question banks.

## Monetization Ideas

- Freemium daily energy.
- Pro subscription for unlimited AI checks and analytics.
- One-time premium STEM/ICT module bundles.
- Mentor booking commission.
- Paid mock contests and olympiad events.
- Institutional dashboards for schools/coaching centers.

## Edge Cases Handled

- Missing Gemini key falls back to deterministic local rubric.
- Gemini malformed JSON is parsed defensively and validated.
- API route spam is rate-limited.
- Speech recognition unsupported browsers show a toast and allow typing.
- Short answers are rejected client-side or scored appropriately.
- OTP attempts, expiry, cooldown, and hashing are implemented.
