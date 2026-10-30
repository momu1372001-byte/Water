import { describe, expect, it } from 'vitest';
import { validateLessonContent } from '@/engine/content-validation';
import { CONTENT_SCHEMA_VERSION } from '@/content/schemas/lesson-schema';

const lesson = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  id: 'family-test',
  title: 'Family',
  topic: 'Family',
  category: 'Everyday English',
  cefrLevel: 'A1',
  objectives: [{ en: 'Name family members' }],
  studyCards: [{
    kind: 'vocabulary', id: 'mother', word: 'mother',
    translations: { en: 'mother', ar: 'أم' },
    imagePath: '/content-assets/family/mother.jpg', difficulty: 'easy',
  }],
  questions: [{
    id: 'q1', type: 'multiple_choice', prompt: { en: 'Choose one' },
    options: ['mother', 'brother'], correctIndex: 0, difficulty: 'easy',
  }],
};

describe('content validation', () => {
  it('accepts a valid JSON lesson and preserves its card data', () => {
    expect(validateLessonContent(lesson)).toEqual([]);
    expect(lesson.studyCards[0].word).toBe('mother');
    expect(lesson.studyCards[0].imagePath).toContain('/content-assets/');
  });

  it('reports duplicate card and question IDs', () => {
    const result = validateLessonContent({
      ...lesson,
      questions: [{ ...lesson.questions[0], id: 'mother' }],
    });
    expect(result.some((item) => item.message.includes('Duplicate ID'))).toBe(true);
  });

  it('reports an invalid answer option reference', () => {
    const result = validateLessonContent({
      ...lesson,
      questions: [{ ...lesson.questions[0], correctIndex: 4 }],
    });
    expect(result.some((item) => item.field.endsWith('correctIndex'))).toBe(true);
  });

  it('reports missing English translations and invalid asset paths', () => {
    const result = validateLessonContent({
      ...lesson,
      studyCards: [{ ...lesson.studyCards[0], translations: { ar: 'أم' }, imagePath: 'family/mother.jpg' }],
    });
    expect(result.some((item) => item.message.includes('English translation'))).toBe(true);
    expect(result.some((item) => item.message.includes('absolute'))).toBe(true);
  });

  it('returns a useful error for malformed JSON data', () => {
    const result = validateLessonContent({ schemaVersion: 99 });
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((item) => item.field === 'schemaVersion')).toBe(true);
  });
});
