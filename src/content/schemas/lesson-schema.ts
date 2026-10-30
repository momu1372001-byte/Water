import { z } from 'zod';

/**
 * Content schema version. Increment when the lesson JSON structure changes
 * in a breaking way. The loader rejects incompatible versions.
 */
export const CONTENT_SCHEMA_VERSION = 1;

/**
 * A translated string — maps a locale code (e.g. "ar", "fr", "hi", "es", "de")
 * to its translation. The English learning content itself is always in English;
 * these translations are for the learner's interface language.
 */
export const translatedStringSchema = z.record(z.string(), z.string()).superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one translation is required' });
  }
});

export const cefrLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

export const questionTypeSchema = z.enum([
  'multiple_choice', 'true_false', 'fill_blank', 'word_bank', 'match_pairs',
  'order_words', 'listen_choose', 'listen_type', 'select_image', 'spell_word',
]);

export const difficultySchema = z.enum(['easy', 'medium', 'hard']).default('medium');

/**
 * Audio configuration — either a URL to an audio file or TTS settings.
 */
export const audioConfigSchema = z.object({
  url: z.string().optional(),
  tts: z.object({
    enabled: z.boolean().default(true),
    rate: z.number().min(0.5).max(2).default(1),
    voice: z.string().optional(),
  }).optional(),
}).optional();

/**
 * Rich grammar notes — hidden by default, shown in a modal when requested.
 */
export const grammarNoteSchema = z.object({
  title: z.string().min(1),
  explanation: translatedStringSchema,
  whenToUse: translatedStringSchema.optional(),
  structure: translatedStringSchema.optional(),
  positiveForm: translatedStringSchema.optional(),
  negativeForm: translatedStringSchema.optional(),
  questionForm: translatedStringSchema.optional(),
  exceptions: translatedStringSchema.optional(),
  commonMistakes: translatedStringSchema.optional(),
  tips: translatedStringSchema.optional(),
  examples: z.array(
    z.object({
      english: z.string().min(1),
      translation: translatedStringSchema,
    }),
  ).optional(),
});

/**
 * Vocabulary item — used in lesson vocabulary list.
 */
export const vocabularyItemSchema = z.object({
  word: z.string().min(1),
  partOfSpeech: z.string().min(1).optional(),
  phonetic: z.string().optional(),
  translations: translatedStringSchema,
  exampleSentence: z.string().min(1).optional(),
  exampleTranslation: translatedStringSchema.optional(),
  imagePath: z.string().optional(),
  audio: audioConfigSchema,
  audioUrl: z.string().optional(),
});

/**
 * Study card — vocabulary, grammar, or sentence.
 * Vocabulary cards have rich front-side content: image, word, pronunciation,
 * example sentence, audio, hidden translation, and grammar notes.
 */
export const studyCardSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('vocabulary'),
    id: z.string().min(1),
    word: z.string().min(1),
    translations: translatedStringSchema,
    partOfSpeech: z.string().min(1).optional(),
    phonetic: z.string().optional(),
    imagePath: z.string().optional(),
    imageAlt: z.string().optional(),
    audio: audioConfigSchema,
    audioUrl: z.string().optional(),
    exampleSentence: z.string().min(1).optional(),
    exampleTranslation: translatedStringSchema.optional(),
    usageNotes: translatedStringSchema.optional(),
    grammar: grammarNoteSchema.optional(),
    difficulty: difficultySchema,
  }),
  z.object({
    kind: z.literal('grammar'),
    id: z.string().min(1),
    front: z.string().min(1),
    back: translatedStringSchema,
    grammar: grammarNoteSchema.optional(),
    examples: z.array(
      z.object({
        english: z.string().min(1),
        translation: translatedStringSchema,
      }),
    ).optional(),
    difficulty: difficultySchema,
  }),
  z.object({
    kind: z.literal('sentence'),
    id: z.string().min(1),
    front: z.string().min(1),
    back: translatedStringSchema,
    audio: audioConfigSchema,
    audioUrl: z.string().optional(),
    grammar: grammarNoteSchema.optional(),
    difficulty: difficultySchema,
  }),
]);

/**
 * TTS settings for a question or lesson.
 */
export const ttsSettingsSchema = audioConfigSchema;

export const feedbackSchema = z.object({
  correct: translatedStringSchema.optional(),
  incorrect: translatedStringSchema.optional(),
  perOption: z.record(z.string(), translatedStringSchema).optional(),
});

/**
 * Base fields shared by all question types.
 */
export const questionBaseSchema = z.object({
  id: z.string().min(1),
  type: questionTypeSchema,
  prompt: translatedStringSchema,
  promptEnglish: z.string().min(1).optional(),
  supportingText: translatedStringSchema.optional(),
  tts: audioConfigSchema,
  audio: audioConfigSchema,
  audioUrl: z.string().optional(),
  imagePath: z.string().optional(),
  imageAlt: z.string().optional(),
  hint: translatedStringSchema.optional(),
  feedback: feedbackSchema.optional(),
  grammar: grammarNoteSchema.optional(),
  difficulty: difficultySchema,
  skill: z.string().optional(),
  points: z.number().int().min(1).default(10),
});

export const multipleChoiceQuestionSchema = questionBaseSchema.extend({
  type: z.literal('multiple_choice'),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
  distractors: z.array(z.string()).optional(),
});

export const trueFalseQuestionSchema = questionBaseSchema.extend({
  type: z.literal('true_false'),
  statement: z.string().min(1),
  isTrue: z.boolean(),
});

export const fillBlankQuestionSchema = questionBaseSchema.extend({
  type: z.literal('fill_blank'),
  sentenceTemplate: z.string().min(1),
  acceptableAnswers: z.array(z.string()).min(1),
  caseSensitive: z.boolean().default(false),
});

export const wordBankQuestionSchema = questionBaseSchema.extend({
  type: z.literal('word_bank'),
  bank: z.array(z.string()).min(2),
  correctOrder: z.array(z.string()).min(1),
  extraWords: z.array(z.string()).default([]),
});

export const matchPairsQuestionSchema = questionBaseSchema.extend({
  type: z.literal('match_pairs'),
  pairs: z.array(
    z.object({
      english: z.string().min(1),
      translation: z.string().min(1),
    }),
  ).min(2),
});

export const orderWordsQuestionSchema = questionBaseSchema.extend({
  type: z.literal('order_words'),
  shuffled: z.array(z.string()).min(2),
  correctOrder: z.array(z.string()).min(2),
});

export const listenChooseQuestionSchema = questionBaseSchema.extend({
  type: z.literal('listen_choose'),
  audioText: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctIndex: z.number().int().min(0),
});

export const listenTypeQuestionSchema = questionBaseSchema.extend({
  type: z.literal('listen_type'),
  audioText: z.string().min(1),
  acceptableAnswers: z.array(z.string()).min(1),
  caseSensitive: z.boolean().default(false),
});

export const selectImageQuestionSchema = questionBaseSchema.extend({
  type: z.literal('select_image'),
  promptEnglish: z.string().min(1),
  options: z.array(
    z.object({
      imagePath: z.string().min(1),
      label: z.string().optional(),
    }),
  ).min(2),
  correctIndex: z.number().int().min(0),
});

export const spellWordQuestionSchema = questionBaseSchema.extend({
  type: z.literal('spell_word'),
  targetWord: z.string().min(1),
  audioUrl: z.string().optional(),
  audio: audioConfigSchema,
  caseSensitive: z.boolean().default(false),
});

export const questionSchema = z.discriminatedUnion('type', [
  multipleChoiceQuestionSchema, trueFalseQuestionSchema, fillBlankQuestionSchema,
  wordBankQuestionSchema, matchPairsQuestionSchema, orderWordsQuestionSchema,
  listenChooseQuestionSchema, listenTypeQuestionSchema, selectImageQuestionSchema,
  spellWordQuestionSchema,
]);

export const completionRequirementsSchema = z.object({
  minScorePercent: z.number().min(0).max(100).default(70),
  requireAllQuestions: z.boolean().default(true),
}).default({ minScorePercent: 70, requireAllQuestions: true });

/**
 * A lesson JSON file.
 */
export const lessonSchema = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  id: z.string().min(1),
  unitId: z.string().optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: translatedStringSchema.optional(),
  topic: z.string().min(1),
  category: z.string().min(1),
  topicId: z.string().optional(),
  cefrLevel: cefrLevelSchema,
  order: z.number().int().optional(),
  icon: z.string().optional(),
  estimatedDuration: z.number().int().min(1).optional(),
  objectives: z.array(translatedStringSchema).min(1),
  prerequisites: z.array(z.string()).default([]),
  vocabulary: z.array(vocabularyItemSchema).default([]),
  grammarNotes: z.array(grammarNoteSchema).default([]),
  studyCards: z.array(studyCardSchema).default([]),
  questions: z.array(questionSchema).min(1),
  completionRequirements: completionRequirementsSchema,
  imagePath: z.string().optional(),
  tts: audioConfigSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const unitSchema = z.object({
  schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: translatedStringSchema.optional(),
  cefrLevel: cefrLevelSchema,
  lessonIds: z.array(z.string()).min(1),
  imagePath: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// ---- Inferred TypeScript types ----

export type TranslatedString = z.infer<typeof translatedStringSchema>;
export type CEFRLevel = z.infer<typeof cefrLevelSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type AudioConfig = z.infer<typeof audioConfigSchema>;
export type VocabularyItem = z.infer<typeof vocabularyItemSchema>;
export type GrammarNote = z.infer<typeof grammarNoteSchema>;
export type StudyCard = z.infer<typeof studyCardSchema>;
export type Feedback = z.infer<typeof feedbackSchema>;
export type Question = z.infer<typeof questionSchema>;
export type MultipleChoiceQuestion = z.infer<typeof multipleChoiceQuestionSchema>;
export type TrueFalseQuestion = z.infer<typeof trueFalseQuestionSchema>;
export type FillBlankQuestion = z.infer<typeof fillBlankQuestionSchema>;
export type WordBankQuestion = z.infer<typeof wordBankQuestionSchema>;
export type MatchPairsQuestion = z.infer<typeof matchPairsQuestionSchema>;
export type OrderWordsQuestion = z.infer<typeof orderWordsQuestionSchema>;
export type ListenChooseQuestion = z.infer<typeof listenChooseQuestionSchema>;
export type ListenTypeQuestion = z.infer<typeof listenTypeQuestionSchema>;
export type SelectImageQuestion = z.infer<typeof selectImageQuestionSchema>;
export type SpellWordQuestion = z.infer<typeof spellWordQuestionSchema>;
export type CompletionRequirements = z.infer<typeof completionRequirementsSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Unit = z.infer<typeof unitSchema>;
