import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "prisma/config";

const envPaths = [resolve(process.cwd(), ".env"), resolve(process.cwd(), ".env.local")];
const runtime = globalThis as typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

function readDotenvValues() {
  const values = new Map<string, string>();

  for (const envPath of envPaths) {
    if (!existsSync(envPath)) {
      continue;
    }

    const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");

      if (separator === -1) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");

      values.set(key, value);
    }
  }

  return values;
}

const dotenvValues = readDotenvValues();
const fallbackDatabaseUrl = "postgresql://user:password@localhost:5432/kinetic_academy";

for (const [key, value] of dotenvValues) {
  const runtimeEnv = runtime.process?.["env"];

  if (runtimeEnv) {
    runtimeEnv[key] = value;
  }
}

const runtimeEnv = runtime.process?.["env"];
const databaseUrl = dotenvValues.get("DATABASE_URL") ?? runtimeEnv?.DATABASE_URL ?? fallbackDatabaseUrl;

if (runtimeEnv) {
  runtimeEnv.DATABASE_URL = databaseUrl;
  runtimeEnv.DIRECT_URL = dotenvValues.get("DIRECT_URL") ?? runtimeEnv.DIRECT_URL ?? databaseUrl;
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: databaseUrl,
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
