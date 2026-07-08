import { success } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";

export const GET = withAuth(async (_request, _context, session) => {
  const [courses, attempts, progress, feynmanRecords] = await Promise.all([
    db.teacherCourse.findMany({
      where: { teacherId: session.userId },
      orderBy: { updatedAt: "desc" },
      include: {
        subject: { select: { name: true } },
      },
    }),
    db.questionAttempt.findMany({
      orderBy: { createdAt: "desc" },
      take: 300,
      include: {
        user: { select: { id: true, name: true } },
        question: {
          include: {
            topic: { select: { id: true, name: true } },
            subject: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.learningProgress.findMany({
      orderBy: { updatedAt: "desc" },
      take: 300,
      include: {
        user: { select: { id: true, name: true } },
        topic: { select: { id: true, name: true } },
      },
    }),
    db.assessmentRecord.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        topic: { select: { id: true, name: true } },
      },
    }),
  ]);

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length;
  const atRiskStudents = new Set(
    attempts
      .filter((attempt) => !attempt.isCorrect)
      .map((attempt) => attempt.userId),
  );
  const averageFeynmanScore =
    feynmanRecords.length === 0
      ? 0
      : Math.round(
          feynmanRecords.reduce((sum, record) => sum + record.feynmanScore, 0) /
            feynmanRecords.length,
        );

  return success({
    courses,
    metrics: {
      totalAttempts,
      accuracy: totalAttempts === 0 ? 0 : Math.round((correctAttempts / totalAttempts) * 100),
      progressRecords: progress.length,
      atRiskStudents: atRiskStudents.size,
      averageFeynmanScore,
    },
    recentAttempts: attempts.slice(0, 20),
  });
});
