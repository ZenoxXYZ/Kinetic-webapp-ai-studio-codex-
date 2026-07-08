# Kinetic Academy - Local Setup

## Run in VS Code

1. Open this folder in VS Code:
   `C:\Users\Lenovo\OneDrive\Documents\Kinetic academy`

2. Install dependencies:
   ```bash
   corepack pnpm install
   ```

3. Start the local database if you want the Prisma-backed API routes:
   ```bash
   docker compose up -d
   ```

4. Generate Prisma Client:
   ```bash
   corepack pnpm db:generate
   ```

5. Validate the project:
   ```bash
   corepack pnpm typecheck
   corepack pnpm lint
   ```

6. Start the app:
   ```bash
   corepack pnpm dev
   ```

7. Open:
   `http://localhost:3000`

## Environment

`.env.local` is already created for local development. It uses the Postgres credentials from `docker-compose.yml`.

If you want real AI responses later, add your Gemini key:

```bash
GEMINI_API_KEY=your_key_here
```

Without a Gemini key, the app can still run using local deterministic AI rubrics.
