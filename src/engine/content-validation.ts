import { lessonSchema } from '@/content/schemas/lesson-schema';
import type { Lesson } from '@/content/schemas/lesson-schema';

export interface ContentDiagnostic {
  field: string;
  message: string;
}

const assetPathPattern = /^(https?:\/\/|\/content-assets\/|content-assets\/)/;

export function validateLessonContent(raw: unknown): ContentDiagnostic[] {
  const parsed = lessonSchema.safeParse(raw);
  if (!parsed.success) {
    return parsed.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'lesson',
      message: issue.message,
    }));
  }

  return validateParsedLesson(parsed.data);
}

export function validateParsedLesson(lesson: Lesson): ContentDiagnostic[] {
  const diagnostics: ContentDiagnostic[] = [];
  const ids = new Set<string>();

  const addId = (id: string, field: string) => {
    if (ids.has(id)) diagnostics.push({ field, message: `Duplicate ID "${id}"` });
    ids.add(id);
  };

  lesson.studyCards.forEach((card, index) => {
    addId(card.id, `studyCards.${index}.id`);
    if (card.kind === 'vocabulary') {
      checkTranslations(card.translations, `studyCards.${index}.translations`, diagnostics);
      if (card.exampleTranslation) checkTranslations(card.exampleTranslation, `studyCards.${index}.exampleTranslation`, diagnostics);
      if (card.imagePath && !assetPathPattern.test(card.imagePath)) {
        diagnostics.push({ field: `studyCards.${index}.imagePath`, message: 'Use an absolute /content-assets/ path or an https URL' });
      }
    }
  });

  lesson.questions.forEach((question, index) => {
    addId(question.id, `questions.${index}.id`);
    checkTranslations(question.prompt, `questions.${index}.prompt`, diagnostics);
    if ('options' in question && question.correctIndex >= question.options.length) {
      diagnostics.push({ field: `questions.${index}.correctIndex`, message: 'Correct option must reference an available option' });
    }
    if (question.type === 'order_words' && question.correctOrder.some((word) => !question.shuffled.includes(word))) {
      diagnostics.push({ field: `questions.${index}.correctOrder`, message: 'Every correct answer word must exist in shuffled words' });
    }
    for (const key of ['imagePath', 'audioUrl'] as const) {
      const value = question[key];
      if (value && key === 'imagePath' && !assetPathPattern.test(value)) {
        diagnostics.push({ field: `questions.${index}.${key}`, message: 'Use an absolute /content-assets/ path or an https URL' });
      }
    }
  });

  return diagnostics;
}

function checkTranslations(value: Record<string, string>, field: string, diagnostics: ContentDiagnostic[]) {
  if (!value.en?.trim()) diagnostics.push({ field, message: 'English translation is required' });
}
