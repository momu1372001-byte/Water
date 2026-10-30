import { useCallback, useEffect, useState } from 'react';
import { fetchAllProgress, upsertProgress, type LessonProgressMap } from '@/services/progressService';
import { useAuth } from '@/hooks/useAuth';

export function useProgress() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<LessonProgressMap>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setProgress({});
      return;
    }
    setLoading(true);
    fetchAllProgress().then((result) => {
      if (active) {
        setProgress(result);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [user]);

  const saveProgress = useCallback(async (...args: Parameters<typeof upsertProgress>) => {
    if (!user) return { error: 'Sign in to save your progress.' };
    const result = await upsertProgress(...args);
    if (!result.error) {
      const next = await fetchAllProgress();
      setProgress(next);
    }
    return result;
  }, [user]);

  return { progress, loading, saveProgress };
}
