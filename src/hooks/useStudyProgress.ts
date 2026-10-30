import { useState, useCallback, useEffect } from 'react';

export interface CardState {
  bookmarked: boolean;
  known: boolean;
}

export interface StudyProgress {
  cardIndex: number;
  cardStates: Record<string, CardState>;
}

const STORAGE_KEY = (lessonId: string) => `lingua.study.${lessonId}`;

function load(lessonId: string): StudyProgress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY(lessonId));
    return raw ? JSON.parse(raw) as StudyProgress : null;
  } catch {
    return null;
  }
}

function save(lessonId: string, progress: StudyProgress) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY(lessonId), JSON.stringify(progress));
  } catch {
    // Storage might be full or blocked
  }
}

/**
 * Persist study-card position and per-card state (bookmarked, known/difficult)
 * to localStorage so a learner who exits and returns resumes where they stopped.
 */
export function useStudyProgress(lessonId: string, totalCards: number) {
  const [index, setIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  useEffect(() => {
    const stored = load(lessonId);
    if (stored) {
      setIndex(Math.min(stored.cardIndex, Math.max(0, totalCards - 1)));
      setCardStates(stored.cardStates ?? {});
    } else {
      setIndex(0);
      setCardStates({});
    }
  }, [lessonId, totalCards]);

  const update = useCallback((next: StudyProgress) => {
    save(lessonId, next);
  }, [lessonId]);

  const goTo = useCallback((newIndex: number) => {
    const clamped = Math.max(0, Math.min(totalCards - 1, newIndex));
    setIndex(clamped);
    update({ cardIndex: clamped, cardStates });
  }, [totalCards, cardStates, update]);

  const toggleBookmark = useCallback((cardId: string) => {
    setCardStates((prev) => {
      const state = prev[cardId] ?? { bookmarked: false, known: false };
      const next = { ...prev, [cardId]: { ...state, bookmarked: !state.bookmarked } };
      update({ cardIndex: index, cardStates: next });
      return next;
    });
  }, [index, update]);

  const toggleKnown = useCallback((cardId: string) => {
    setCardStates((prev) => {
      const state = prev[cardId] ?? { bookmarked: false, known: false };
      const next = { ...prev, [cardId]: { ...state, known: !state.known } };
      update({ cardIndex: index, cardStates: next });
      return next;
    });
  }, [index, update]);

  const getCardState = useCallback((cardId: string): CardState => {
    return cardStates[cardId] ?? { bookmarked: false, known: false };
  }, [cardStates]);

  return { index, goTo, toggleBookmark, toggleKnown, getCardState };
}
