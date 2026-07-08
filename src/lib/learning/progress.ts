import { startOfDay, startOfWeek } from "@/lib/learning/time";
import { db } from "@/lib/db/client";

export async function getTotalXp(userId: string) {
  const [total, thisWeek] = await Promise.all([
    db.xpLedger.aggregate({
      where: { userId },
      _sum: { points: true },
    }),
    db.xpLedger.aggregate({
      where: {
        userId,
        createdAt: {
          gte: startOfWeek(new Date()),
        },
      },
      _sum: { points: true },
    }),
  ]);

  const totalPoints = total._sum.points ?? 0;

  return {
    total: totalPoints,
    thisWeek: thisWeek._sum.points ?? 0,
    level: Math.floor(totalPoints / 100) + 1,
  };
}

export async function recordXp(userId: string, points: number, reason: string) {
  if (points <= 0) {
    return null;
  }

  return db.xpLedger.create({
    data: {
      userId,
      points,
      reason,
    },
  });
}

export async function recordTodayStreak(userId: string) {
  return db.streakLedger.upsert({
    where: {
      userId_studyDate: {
        userId,
        studyDate: startOfDay(new Date()),
      },
    },
    update: {},
    create: {
      userId,
      studyDate: startOfDay(new Date()),
    },
  });
}

export async function getStreakStats(userId: string) {
  const entries = await db.streakLedger.findMany({
    where: { userId },
    orderBy: { studyDate: "desc" },
  });

  let current = 0;
  let longest = 0;
  let running = 0;
  let cursor = startOfDay(new Date()).getTime();

  for (const entry of entries) {
    const day = startOfDay(entry.studyDate).getTime();

    if (day === cursor) {
      current += 1;
      running += 1;
      cursor -= 24 * 60 * 60 * 1000;
    } else {
      running = 1;
    }

    longest = Math.max(longest, running);
  }

  return {
    current,
    longest,
    lastActivity: entries[0]?.studyDate ?? null,
  };
}
