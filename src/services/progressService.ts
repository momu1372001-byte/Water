import { supabase } from '@/services/supabaseClient';

export interface LessonProgress {
  id: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  scorePercent: number | null;
  bestScorePercent: number | null;
  questionsTotal: number | null;
  questionsCorrect: number | null;
  completedAt: string | null;
}

export interface LessonProgressMap {
  [lessonId: string]: LessonProgress;
}

/**
 * Fetch all lesson progress for the current user.
 */
export async function fetchAllProgress(): Promise<LessonProgressMap> {
  const { data, error } = await supabase
    .from('lesson_progress')
    .select('lesson_id, status, score_percent, best_score_percent, questions_total, questions_correct, completed_at');

  if (error) {
    console.error('Failed to fetch progress:', error.message);
    return {};
  }

  const map: LessonProgressMap = {};
  for (const row of data ?? []) {
    map[row.lesson_id] = {
      id: row.lesson_id,
      lessonId: row.lesson_id,
      status: row.status,
      scorePercent: row.score_percent,
      bestScorePercent: row.best_score_percent,
      questionsTotal: row.questions_total,
      questionsCorrect: row.questions_correct,
      completedAt: row.completed_at,
    };
  }
  return map;
}

/**
 * Upsert lesson progress. If a row already exists for this user+lesson,
 * update it (preserving best_score_percent as the max of old and new).
 */
export async function upsertProgress(
  lessonId: string,
  status: LessonProgress['status'],
  scorePercent?: number,
  questionsTotal?: number,
  questionsCorrect?: number,
): Promise<{ error: string | null }> {
  const completedAt = status === 'completed' ? new Date().toISOString() : null;

  const { data: existing } = await supabase
    .from('lesson_progress')
    .select('best_score_percent')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  const previousBest = existing?.best_score_percent ?? null;
  const newBest =
    scorePercent != null
      ? Math.max(scorePercent, previousBest ?? -1)
      : previousBest;

  const { error } = await supabase
    .from('lesson_progress')
    .upsert(
      {
        lesson_id: lessonId,
        status,
        score_percent: scorePercent ?? null,
        best_score_percent: newBest,
        questions_total: questionsTotal ?? null,
        questions_correct: questionsCorrect ?? null,
        completed_at: completedAt,
      },
      { onConflict: 'user_id,lesson_id' },
    );

  return { error: error?.message ?? null };
}

/**
 * Save the user's interface language preference.
 */
export async function saveLocalePreference(locale: string): Promise<void> {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ interface_locale: locale }, { onConflict: 'user_id' });

  if (error) {
    console.error('Failed to save locale preference:', error.message);
  }
}

/**
 * Load the user's interface language preference.
 */
export async function loadLocalePreference(): Promise<string | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('interface_locale')
    .maybeSingle();

  if (error || !data) return null;
  return data.interface_locale;
}
