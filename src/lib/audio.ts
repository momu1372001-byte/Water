import type { AudioConfig } from '@/content/schemas/lesson-schema';

/**
 * Resolve a content asset path to a usable URL.
 * Paths starting with / are treated as relative to the public root.
 * Paths without / are treated as relative to /content-assets/.
 */
export function resolveAssetPath(path: string | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return path;
  return `/content-assets/${path}`;
}

/**
 * Play audio from an AudioConfig — either a URL or TTS fallback.
 * Returns a promise that resolves when playback starts or rejects on error.
 */
export function playAudio(
  config: AudioConfig | undefined,
  fallbackText?: string,
  rate = 1,
): Promise<void> {
  if (config?.url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(config.url);
      audio.playbackRate = rate;
      audio.onended = () => resolve();
      audio.onerror = () => {
        if (fallbackText) {
          speakText(fallbackText, rate).then(resolve).catch(reject);
        } else {
          reject(new Error('Audio playback failed'));
        }
      };
      audio.play().catch(() => {
        if (fallbackText) {
          speakText(fallbackText, rate).then(resolve).catch(reject);
        } else {
          reject(new Error('Audio playback failed'));
        }
      });
    });
  }

  if (config?.tts?.enabled !== false && fallbackText) {
    return speakText(fallbackText, rate);
  }

  return Promise.resolve();
}

/**
 * Use the Web Speech API for text-to-speech.
 */
export function speakText(text: string, rate = 1, voiceName?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Speech synthesis not available'));
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.lang = 'en-US';
    if (voiceName) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.name === voiceName);
      if (voice) utterance.voice = voice;
    }
    utterance.onend = () => resolve();
    utterance.onerror = () => reject(new Error('TTS failed'));
    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Check if any audio capability is available.
 */
export function hasAudioSupport(): boolean {
  return typeof window !== 'undefined' && (!!window.speechSynthesis || !!new Audio().canPlayType);
}
