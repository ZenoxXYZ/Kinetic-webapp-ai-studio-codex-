import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig, env } from "prisma/config";

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

for (const [key, value] of dotenvValues) {
  const runtimeEnv = runtime.process?.["env"];

  if (runtimeEnv) {
    runtimeEnv[key] = value;
  }
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: dotenvValues.get("DATABASE_URL") ?? env("DATABASE_URL"),
  },
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
