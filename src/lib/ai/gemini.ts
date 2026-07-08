import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

import { env } from "@/lib/config/env";
import { logger } from "@/lib/logger";

const DEFAULT_MODEL = "gemini-2.5-flash";

type GeminiJsonArgs<T> = {
  systemInstruction: string;
  prompt: string;
  responseSchema: Record<string, unknown>;
  validator: z.ZodType<T>;
  fallback: () => T;
  context: string;
};

let client: GoogleGenAI | null = null;

function getClient() {
  if (!env.GEMINI_API_KEY) {
    return null;
  }

  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

function parseJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Gemini response did not contain JSON");
    }

    return JSON.parse(match[0]);
  }
}

export async function generateGeminiJson<T>({
  systemInstruction,
  prompt,
  responseSchema,
  validator,
  fallback,
  context,
}: GeminiJsonArgs<T>) {
  const ai = getClient();

  if (!ai) {
    logger.warn(context, "Gemini API key not configured; using local cognitive rubric");
    return { provider: "local-rubric", model: "deterministic-v1", data: fallback() };
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema,
          temperature: 0.2,
        },
      });
      const text = response.text ?? "";
      const data = validator.parse(parseJson(text));

      logger.info(context, "Gemini request completed", { attempt, model: DEFAULT_MODEL });

      return { provider: "google-gemini", model: DEFAULT_MODEL, data };
    } catch (error) {
      if (attempt === 1) {
        logger.warn(context, "Gemini request failed; retrying once", { error });
        continue;
      }

      logger.error(context, "Gemini request failed; using local cognitive rubric", { error });
    }
  }

  return { provider: "local-rubric", model: "deterministic-v1", data: fallback() };
}
