# Kinetic Academy - Full Project Context

## One-Line Summary

Kinetic Academy is an AI-powered admission preparation web app for Bangladeshi students, combining personalized study planning, dynamic exam countdowns, AI-generated practice, cognitive learning loops, mentorship, events, and modern authentication.

## Problem

Many admission candidates study under pressure without a clear personal plan. They often know the exam date, but they do not know how to divide the remaining time, which subjects to prioritize, how to test themselves daily, or how to recover from weak areas. Traditional coaching tools also focus mostly on content delivery, while students need feedback, reminders, progress tracking, and adaptive revision.

Kinetic Academy is designed around that gap. It turns the student's target exam date, subject choices, and learning status into an interactive preparation system.

## Target Users

- Bangladeshi university admission candidates.
- Students preparing for IBA, Medical, B Unit, C Unit, D Unit, and similar competitive exams.
- Learners who need a structured daily plan rather than only question banks.
- Students who want AI support, progress tracking, mentor discovery, and self-testing in one place.

## Core Product Idea

The app works like a personalized study command center.

1. The student signs in using a phone number, Gmail verification, or Google Sign-In.
2. The student goes through onboarding and chooses their exam target.
3. The dashboard shows progress, daily practice, streaks, and learning actions.
4. The Kinetic Countdown lets the student select an exam date on a visual calendar.
5. Gemini AI generates a personalized study plan and daily exam structure.
6. The student can customize the plan inside the Kinetic Calendar.
7. Practice screens generate exam-style questions and explain performance.
8. Cognitive learning modes help students explain, defend, and rebuild concepts.

## Current Tech Stack

- Framework: Next.js App Router with React 19 and TypeScript.
- Styling: Tailwind CSS with custom UI components and motion-driven interactions.
- Animation: Framer Motion.
- Database ORM: Prisma.
- Database target: PostgreSQL.
- AI provider: Google Gemini through `@google/genai`.
- Auth/session security: JWT-style HTTP-only cookies and server route handlers.
- Validation: Zod schemas.
- Deployment target: Netlify with `@netlify/plugin-nextjs`.
- Package manager: pnpm.

## Important Project Folders

```text
src/
  app/
    api/
      ai/                 AI route handlers for study plans and exams
      auth/               Phone, email, Google, session, and logout routes
    demo/
      page.tsx            Main interactive demo/product flow
    page.tsx              Main app entry
    layout.tsx            Root layout
    globals.css           Global styling
  features/
    academy/              Main academy components and learning data
  lib/
    ai/                   Gemini adapter, schemas, and fallback logic
    auth/                 Session, OTP, Google, email OTP helpers
    config/               Environment and app configuration
    db/                   Prisma client singleton
    email/                Email gateway logic
    sms/                  SMS gateway and mock SMS logic
    rate-limit/           In-memory rate limiting
prisma/
  schema.prisma           Database models
  seed.ts                 Seed data
docs/
  API.md                  API notes
  DEPLOYMENT.md           Deployment notes
```

## User Experience Flow

### 1. Authentication

The opening screen supports multiple login options:

- Phone number sign-in.
- Gmail/email verification with a one-time code.
- Google OAuth sign-in.

Phone sign-in is currently designed to be frictionless for the hackathon/demo flow. Email verification remains optional for users who want an extra verification step. Google Sign-In is integrated through `/api/auth/google` and depends on the correct Google OAuth environment variables.

### 2. Onboarding

After authentication, the student enters the onboarding flow. The goal is to collect enough context to make the learning experience feel personalized instead of generic.

The app can then move the student into a generated learning path and dashboard experience.

### 3. Dashboard

The dashboard acts as the student's daily command center. It surfaces:

- Daily practice actions.
- Streak and progress signals.
- Kinetic Countdown entry point.
- Practice navigation.
- Mentor discovery.
- Profile and progress sections.

### 4. Kinetic Countdown

Kinetic Countdown is one of the flagship features.

The student opens the countdown from the dashboard, selects an exam date and time, and the app shows a live countdown in:

```text
Days : Hours : Minutes : Seconds
```

The countdown is not only visual. It becomes the input for AI planning.

### 5. Kinetic Calendar

Kinetic Calendar is the upgraded calendar experience attached to Kinetic Countdown.

Features:

- Large visual calendar interface.
- Date selection.
- Events shown inside date cells when possible.
- Multiple event preview with additional event count.
- Selected date panel showing complete events.
- Study tasks, reminders, daily exams, weekly reviews, and final target dates.

The calendar is designed so a student can see both time pressure and study structure in one place.

### 6. Gemini AI Study Plan

When the student selects an exam date, the app calls the study-plan API:

```text
POST /api/ai/study-plan
```

The server-side Gemini integration generates:

- A personalized plan title.
- Summary of the strategy.
- Daily study tasks.
- Daily exam plan.
- Weekly review reminders.
- Subject-specific focus areas.

If the Gemini key is missing or the provider fails, the app uses a local fallback planner so the product still works during demos.

### 7. AI Daily Exam

The practice screen can call:

```text
POST /api/ai/daily-exam
```

This generates exam-style MCQ questions based on the selected topic, subject, and exam type. The UI can show whether the content came from Gemini or from the local fallback.

### 8. Cognitive Learning Modes

The academy section includes deeper learning experiences beyond simple MCQ practice:

- Feynman mode: students explain concepts in simple language.
- Socratic mode: students defend their reasoning through guided questions.
- First-principles mode: students rebuild an idea from basic assumptions.
- Battle arena: competitive practice concept.
- Kino assistant: AI companion concept for learning support.
- Mentor and events section: discovery flow for live sessions and academic events.

These features position the app as more than a question bank. It is designed around reasoning, retention, and confidence.

## AI Architecture

Gemini is called only from server-side code, never directly from the browser.

Key files:

```text
src/lib/ai/gemini.ts
src/lib/ai/schemas.ts
src/app/api/ai/study-plan/route.ts
src/app/api/ai/daily-exam/route.ts
```

The Gemini adapter:

- Reads `GEMINI_API_KEY` from environment variables.
- Uses structured JSON responses.
- Retries once on provider failure.
- Falls back to local deterministic logic if needed.
- Keeps model upgrade simple through a single adapter.

This protects the API key and keeps the UI clean.

## Authentication Architecture

Key files:

```text
src/app/api/auth/phone/sign-in/route.ts
src/app/api/auth/email/request/route.ts
src/app/api/auth/email/verify/route.ts
src/app/api/auth/google/route.ts
src/app/api/auth/me/route.ts
src/lib/auth/session.ts
src/lib/auth/google.ts
src/lib/auth/email-otp.ts
src/lib/auth/stateless-email-otp.ts
```

The app supports:

- Phone sign-in.
- Email verification code flow.
- Google OAuth flow.
- Session cookie creation.
- Stateless fallback behavior when the database is unavailable.
- Rate limiting to reduce abuse.

For production, real email requires Resend configuration. Real SMS requires a paid SMS provider.

## Database Architecture

The Prisma schema models a complete learning platform. Important models include:

- User
- AuthAccount
- Session
- OtpChallenge
- EmailOtpChallenge
- StudentProfile
- ExamTarget
- Subject
- Chapter
- Topic
- Question
- QuestionOption
- QuestionAttempt
- MockTestAttempt
- AiInteraction
- XpLedger
- StreakLedger
- Achievement
- MentorProfile
- Event
- EventRegistration
- PersonalNote
- CommunityPost
- TeacherCourse
- InterviewSession

This schema supports authentication, curriculum, exams, progress, AI interactions, mentorship, events, community features, and future teacher tools.

## Deployment Notes

The project is configured for Netlify.

Important files:

```text
netlify.toml
.npmrc
prisma.config.ts
prisma/schema.prisma
```

The build command is:

```bash
pnpm run prisma:generate && pnpm run build
```

The Prisma config includes a safe fallback database URL so Netlify can generate the Prisma client even if the production database variable is not available during build. For real production persistence, Netlify should still receive a real `DATABASE_URL`.

## Required Environment Variables

Minimum recommended production variables:

```env
NEXT_PUBLIC_APP_URL=https://kinetic-academy.netlify.app
JWT_SECRET=your-long-random-secret
GEMINI_API_KEY=your-gemini-api-key
SMS_USE_MOCK=true
EMAIL_USE_MOCK=true
```

For Google OAuth:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://kinetic-academy.netlify.app/api/auth/google
```

For real email verification:

```env
EMAIL_USE_MOCK=false
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Kinetic Academy <verified@yourdomain.com>
```

For real SMS OTP:

```env
SMS_USE_MOCK=false
SMS_GATEWAY_URL=provider-api-url
SMS_API_KEY=provider-api-key
```

## What Makes This Hackathon Project Strong

- It solves a clear student pain point: planning and accountability before high-stakes exams.
- It uses AI for a practical workflow, not only chat.
- It has a dynamic countdown tied to a study plan.
- It includes an event-aware Kinetic Calendar.
- It has multiple authentication options.
- It has server-side API routes, validation, rate limiting, and fallback behavior.
- It uses a database schema that can scale into a real education platform.
- It combines motivation, exam practice, AI feedback, and mentorship.

## Future Expansion Ideas

- Real SMS OTP through a Bangladeshi SMS gateway.
- Fully persistent calendar events stored per user.
- Push notifications for daily and weekly exam reminders.
- Admin dashboard for curriculum and event management.
- Teacher portal for course publishing.
- Mentor booking with payments.
- Leaderboards and live battle rooms.
- Analytics dashboard for weak subjects and predicted score.
- Redis-backed rate limiting for production scale.
- Mobile app using the same API backend.

## Demo Checklist

Before recording the hackathon video:

1. Open the deployed or local app.
2. Show the login screen.
3. Sign in with phone or email.
4. Show onboarding.
5. Open the dashboard.
6. Select Kinetic Countdown.
7. Pick an exam date from Kinetic Calendar.
8. Show the live countdown.
9. Show the AI-generated plan.
10. Edit or customize one plan item.
11. Show daily exam/practice.
12. Mention Gemini fallback behavior.
13. Show mentor/events or cognitive learning modes.
14. End with impact and future roadmap.

