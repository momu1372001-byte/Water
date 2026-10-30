import type {
  Question,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  FillBlankQuestion,
  ListenChooseQuestion,
  ListenTypeQuestion,
  SpellWordQuestion,
} from '@/content/schemas/lesson-schema';

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[.!?,]/g, '').replace(/\s+/g, ' ');
}

function answerForQuestion(question: Question): string {
  switch (question.type) {
    case 'multiple_choice':
    case 'listen_choose':
      return question.options[question.correctIndex] ?? '';
    case 'true_false':
      return question.isTrue ? 'True' : 'False';
    case 'fill_blank':
    case 'listen_type':
      return question.acceptableAnswers.join(' / ');
    case 'word_bank':
    case 'order_words':
      return question.correctOrder.join(' ');
    case 'match_pairs':
      return question.pairs.map((pair) => `${pair.english} — ${pair.translation}`).join(', ');
    case 'select_image':
      return question.options[question.correctIndex]?.label ?? `Image ${question.correctIndex + 1}`;
    case 'spell_word':
      return question.targetWord;
  }
}

export function evaluateAnswer(question: Question, answer: unknown): AnswerResult {
  let correct = false;

  switch (question.type) {
    case 'multiple_choice':
    case 'listen_choose':
    case 'select_image':
      correct = Number(answer) === question.correctIndex;
      break;
    case 'true_false':
      correct = Boolean(answer) === question.isTrue;
      break;
    case 'fill_blank':
    case 'listen_type':
    case 'spell_word': {
      const value = String(answer ?? '');
      const answers = question.type === 'spell_word' ? [question.targetWord] : question.acceptableAnswers;
      correct = answers.some((candidate) =>
        question.caseSensitive ? value.trim() === candidate.trim() : normalize(value) === normalize(candidate),
      );
      break;
    }
    case 'word_bank':
    case 'order_words': {
      const submitted = Array.isArray(answer) ? answer.join(' ') : String(answer ?? '');
      correct = normalize(submitted) === normalize(question.correctOrder.join(' '));
      break;
    }
    case 'match_pairs':
      correct = Array.isArray(answer) && answer.length === question.pairs.length && answer.every((item, index) => {
        const pair = question.pairs[index];
        return item === pair.translation;
      });
      break;
  }

  return { correct, correctAnswer: answerForQuestion(question) };
}

export function questionUsesTextInput(question: Question): question is FillBlankQuestion | ListenTypeQuestion | SpellWordQuestion {
  return ['fill_blank', 'listen_type', 'spell_word'].includes(question.type);
}

export function questionUsesOptions(question: Question): question is MultipleChoiceQuestion | ListenChooseQuestion | TrueFalseQuestion {
  return ['multiple_choice', 'listen_choose', 'true_false'].includes(question.type);
}

export function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}
