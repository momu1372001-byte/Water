import { useState, useEffect, useCallback } from 'react';
import type { AudioConfig } from '@/content/schemas/lesson-schema';
import { playAudio } from '@/lib/audio';

/**
 * Hook for playing audio from an AudioConfig with loading and error state.
 */
export function useAudioPlayer() {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPlaying(false);
  }, []);

  const play = useCallback(async (config: AudioConfig | undefined, fallbackText?: string, rate?: number) => {
    if (playing) {
      stop();
      return;
    }
    setError(null);
    setPlaying(true);
    try {
      await playAudio(config, fallbackText, rate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audio failed');
    } finally {
      setPlaying(false);
    }
  }, [playing, stop]);

  useEffect(() => stop, [stop]);

  return { playing, error, play, stop };
}
