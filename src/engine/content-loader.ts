import { lessonSchema, unitSchema, CONTENT_SCHEMA_VERSION } from '@/content/schemas/lesson-schema';
import type { Lesson, Unit, Question } from '@/content/schemas/lesson-schema';
import { validateParsedLesson } from '@/engine/content-validation';
import { lessonFiles, unitFiles } from 'virtual:content-manifest';

/**
 * A validation error identifies the exact file and field that failed.
 */
export interface ContentValidationError {
  file: string;
  field?: string;
  message: string;
}

export interface ContentLoadResult<T> {
  data: T;
  path: string;
}

export interface ContentLoadError {
  path: string;
  errors: ContentValidationError[];
}

/**
 * Validate and parse a lesson JSON file against the schema.
 * Collects all errors rather than failing on the first one.
 */
export function validateLesson(raw: unknown, path: string): ContentLoadError | null {
  const result = lessonSchema.safeParse(raw);
  if (result.success) return null;

  return {
    path,
    errors: result.error.issues.map((issue) => ({
      file: path,
      field: issue.path.join('.') || undefined,
      message: issue.message,
    })),
  };
}

/**
 * Validate and parse a unit JSON file against the schema.
 */
export function validateUnit(raw: unknown, path: string): ContentLoadError | null {
  const result = unitSchema.safeParse(raw);
  if (result.success) return null;

  return {
    path,
    errors: result.error.issues.map((issue) => ({
      file: path,
      field: issue.path.join('.') || undefined,
      message: issue.message,
    })),
  };
}

/**
 * Check schema version compatibility without rejecting the whole file.
 */
export function checkVersion(raw: unknown): { ok: boolean; version?: number; expected: number } {
  if (typeof raw === 'object' && raw !== null && 'schemaVersion' in raw) {
    const v = (raw as { schemaVersion: unknown }).schemaVersion;
    if (typeof v === 'number') {
      return { ok: v === CONTENT_SCHEMA_VERSION, version: v, expected: CONTENT_SCHEMA_VERSION };
    }
  }
  return { ok: false, expected: CONTENT_SCHEMA_VERSION };
}

export interface LoadedContent {
  lessons: ContentLoadResult<Lesson>[];
  units: ContentLoadResult<Unit>[];
  errors: ContentLoadError[];
}

/**
 * Discover, validate, and load all content from the manifest.
 * This is called once at app startup. Invalid files are collected as errors
 * rather than crashing the application. Valid files are available for use.
 */
export function loadAllContent(): LoadedContent {
  const lessons: ContentLoadResult<Lesson>[] = [];
  const units: ContentLoadResult<Unit>[] = [];
  const errors: ContentLoadError[] = [];

  for (const entry of lessonFiles) {
    const error = validateLesson(entry.data, entry.path);
    if (error) {
      errors.push(error);
      continue;
    }
    const parsed = lessonSchema.parse(entry.data);
    const diagnostics = validateParsedLesson(parsed);
    if (diagnostics.length > 0) {
      errors.push({
        path: entry.path,
        errors: diagnostics.map((diagnostic) => ({ file: entry.path, field: diagnostic.field, message: diagnostic.message })),
      });
      continue;
    }
    lessons.push({ data: parsed, path: entry.path });
  }

  for (const entry of unitFiles) {
    const error = validateUnit(entry.data, entry.path);
    if (error) {
      errors.push(error);
      continue;
    }
    const parsed = unitSchema.parse(entry.data);
    units.push({ data: parsed, path: entry.path });
  }

  // Cross-reference check: lessons referenced by units must exist
  const lessonIds = new Set(lessons.map((l) => l.data.id));
  for (const unit of units) {
    for (const lessonId of unit.data.lessonIds) {
      if (!lessonIds.has(lessonId)) {
        errors.push({
          path: unit.path,
          errors: [
            {
              file: unit.path,
              field: 'lessonIds',
              message: `References lesson "${lessonId}" which does not exist`,
            },
          ],
        });
      }
    }
  }

  return { lessons, units, errors };
}

/**
 * Get a lesson by ID from loaded content.
 */
export function getLessonById(lessons: ContentLoadResult<Lesson>[], id: string): Lesson | null {
  return lessons.find((l) => l.data.id === id)?.data ?? null;
}

/**
 * Get lessons for a unit, in the unit's defined order.
 */
export function getLessonsForUnit(
  lessons: ContentLoadResult<Lesson>[],
  unit: Unit,
): Lesson[] {
  return unit.lessonIds
    .map((id) => getLessonById(lessons, id))
    .filter((l): l is Lesson => l !== null);
}

/**
 * Get questions for a lesson, filtered to only valid ones.
 * If a question fails runtime validation, it's skipped rather than crashing.
 */
export function getLessonQuestions(lesson: Lesson): Question[] {
  return lesson.questions;
}
