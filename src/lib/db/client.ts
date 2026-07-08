import { PrismaClient } from "@prisma/client";

import { isProduction } from "@/lib/config/env";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ["error"] : ["warn", "error"],
  });

if (!isProduction) {
  globalForPrisma.prisma = db;
}
