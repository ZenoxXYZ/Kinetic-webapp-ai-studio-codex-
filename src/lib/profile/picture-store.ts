import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { hasConfiguredDatabase } from "@/lib/config/env";
import { db } from "@/lib/db/client";
import { logger } from "@/lib/logger";

const storePath = resolve(process.cwd(), "data", "profile-pictures.json");

type PictureStore = Record<string, string>;

function readStore(): PictureStore {
  if (!existsSync(storePath)) {
    return {};
  }

  try {
    return JSON.parse(readFileSync(storePath, "utf8")) as PictureStore;
  } catch (cause) {
    logger.warn("profile.picture-store", "Could not read local profile picture store", { cause });
    return {};
  }
}

function writeStore(store: PictureStore) {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(store, null, 2));
}

function shouldUseLocalStore(studentId: string) {
  return studentId.startsWith("demo-") || studentId.startsWith("phone-") || studentId.startsWith("email-");
}

export async function saveProfilePicture(studentId: string, imageBase64: string) {
  if (hasConfiguredDatabase && !shouldUseLocalStore(studentId)) {
    try {
      await db.user.update({
        where: { id: studentId },
        data: { avatarUrl: imageBase64 },
      });

      return;
    } catch (cause) {
      logger.warn("profile.picture-store", "Database profile picture save failed; using local store", {
        cause,
        studentId,
      });
    }
  }

  const store = readStore();
  store[studentId] = imageBase64;
  writeStore(store);
}

export async function getProfilePicture(studentId: string) {
  if (hasConfiguredDatabase && !shouldUseLocalStore(studentId)) {
    try {
      const user = await db.user.findUnique({
        where: { id: studentId },
        select: { avatarUrl: true },
      });

      return user?.avatarUrl ?? null;
    } catch (cause) {
      logger.warn("profile.picture-store", "Database profile picture fetch failed; using local store", {
        cause,
        studentId,
      });
    }
  }

  return readStore()[studentId] ?? null;
}
