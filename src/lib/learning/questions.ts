import type { Question, QuestionOption, Subject, Topic } from "@prisma/client";

type QuestionWithRelations = Question & {
  options: QuestionOption[];
  subject?: Pick<Subject, "id" | "name">;
  topic?: Pick<Topic, "id" | "name"> | null;
};

export function serializeQuestion(question: QuestionWithRelations) {
  return {
    id: question.id,
    text: question.text,
    type: question.type,
    difficulty: question.difficulty,
    year: question.year,
    source: question.source,
    explanation: question.explanation,
    subjectId: question.subjectId,
    topicId: question.topicId,
    subject: question.subject,
    topic: question.topic,
    options: question.options
      .sort((left, right) => left.label.localeCompare(right.label))
      .map((option) => ({
        id: option.id,
        label: option.label,
        text: option.text,
      })),
  };
}

export function serializeQuestionWithAnswer(question: QuestionWithRelations) {
  return {
    ...serializeQuestion(question),
    options: question.options
      .sort((left, right) => left.label.localeCompare(right.label))
      .map((option) => ({
        id: option.id,
        label: option.label,
        text: option.text,
        isCorrect: option.isCorrect,
      })),
  };
}
