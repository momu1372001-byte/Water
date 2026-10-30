import { describe, expect, it } from 'vitest';
import { lessonSchema, CONTENT_SCHEMA_VERSION } from '@/content/schemas/lesson-schema';

const baseLesson = {
  schemaVersion: CONTENT_SCHEMA_VERSION,
  id: 'test-lesson',
  title: 'Test lesson',
  topic: 'Testing',
  category: 'Foundation',
  cefrLevel: 'A1',
  objectives: [{ en: 'Learn one thing' }],
  questions: [{
    id: 'q1', type: 'true_false', prompt: { en: 'Is this true?' }, statement: 'Yes', isTrue: true,
  }],
};

describe('lesson schema', () => {
  it('accepts a valid minimal lesson and applies defaults', () => {
    const result = lessonSchema.safeParse(baseLesson);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.prerequisites).toEqual([]);
      expect(result.data.completionRequirements.minScorePercent).toBe(70);
    }
  });

  it('rejects unsupported schema versions with a useful field', () => {
    const result = lessonSchema.safeParse({ ...baseLesson, schemaVersion: 99 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(['schemaVersion']);
  });

  it('rejects questions missing required fields', () => {
    const result = lessonSchema.safeParse({ ...baseLesson, questions: [{ type: 'true_false' }] });
    expect(result.success).toBe(false);
  });
});
