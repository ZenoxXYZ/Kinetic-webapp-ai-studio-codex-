import { z } from "zod";

const emptyStringToUndefined = (value: unknown) =>
  value === "" ? undefined : value;

const optionalString = () =>
  z.preprocess(emptyStringToUndefined, z.string().min(1).optional());

const optionalUrl = () =>
  z.preprocess(emptyStringToUndefined, z.string().url().optional());

const stringWithDefault = (defaultValue: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().min(1).default(defaultValue),
  );

const urlWithDefault = (defaultValue: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z.string().url().default(defaultValue),
  );

const booleanFromString = z.preprocess((value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    }

    if (value.toLowerCase() === "false") {
      return false;
    }
  }

  return value;
}, z.boolean().default(true));

const optionalBooleanFromString = (defaultValue: boolean) =>
  z.preprocess((value) => {
    if (value === undefined || value === "") {
      return defaultValue;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "string") {
      if (value.toLowerCase() === "true") {
        return true;
      }

      if (value.toLowerCase() === "false") {
        return false;
      }
    }

    return value;
  }, z.boolean());

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: urlWithDefault("http://localhost:3000"),
  DATABASE_URL: stringWithDefault("postgresql://kinetic:kinetic@localhost:5432/kinetic_academy"),
  JWT_SECRET: stringWithDefault("kinetic-academy-build-placeholder-secret-32"),
  // Optional because AI routes fall back to deterministic local rubrics.
  GEMINI_API_KEY: optionalString(),
  GOOGLE_CLIENT_ID: optionalString(),
  GOOGLE_CLIENT_SECRET: optionalString(),
  GOOGLE_REDIRECT_URI: optionalUrl(),
  SMS_USE_MOCK: booleanFromString,
  SMS_GATEWAY_URL: optionalUrl(),
  SMS_API_KEY: optionalString(),
  EMAIL_USE_MOCK: optionalBooleanFromString(true),
  RESEND_API_KEY: optionalString(),
  EMAIL_FROM: optionalString(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => {
      const name = issue.path.join(".") || "ENV";
      return `- ${name}: ${issue.message}`;
    })
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsedEnv.data;
export type Env = typeof env;

export const isProduction = process.env.NODE_ENV === "production";
export const hasConfiguredDatabase = Boolean(emptyStringToUndefined(process.env.DATABASE_URL));
export const hasConfiguredJwtSecret = Boolean(emptyStringToUndefined(process.env.JWT_SECRET));
