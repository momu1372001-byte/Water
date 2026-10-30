import { describe, expect, it } from 'vitest';
import { evaluateAnswer } from '@/engine/practice-engine';
import type { Question } from '@/content/schemas/lesson-schema';

describe('practice engine', () => {
  it('evaluates a multiple choice answer', () => {
    const question = {
      id: 'q1', type: 'multiple_choice', prompt: { en: 'Pick one' },
      options: ['hello', 'goodbye'], correctIndex: 0, points: 10, difficulty: 'medium' as const,
    } satisfies Question;

    expect(evaluateAnswer(question, 0)).toEqual({ correct: true, correctAnswer: 'hello' });
    expect(evaluateAnswer(question, 1).correct).toBe(false);
  });

  it('accepts case-insensitive text answers', () => {
    const question = {
      id: 'q2', type: 'fill_blank', prompt: { en: 'Complete' },
      sentenceTemplate: 'Hello, ___', acceptableAnswers: ['Maya'], caseSensitive: false, points: 10, difficulty: 'medium' as const,
    } satisfies Question;

    expect(evaluateAnswer(question, ' maya ')).toEqual({ correct: true, correctAnswer: 'Maya' });
  });

  it('evaluates ordered words', () => {
    const question = {
      id: 'q3', type: 'order_words', prompt: { en: 'Build it' },
      shuffled: ['you', 'Nice', 'to', 'meet'], correctOrder: ['Nice', 'to', 'meet', 'you'], points: 10, difficulty: 'medium' as const,
    } satisfies Question;

    expect(evaluateAnswer(question, ['Nice', 'to', 'meet', 'you']).correct).toBe(true);
    expect(evaluateAnswer(question, ['you', 'meet', 'to', 'Nice']).correct).toBe(false);
  });
});
