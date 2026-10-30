import { useState } from 'react';
import { BookOpen, X, ChevronDown, ChevronUp, Lightbulb, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { GrammarNote } from '@/content/schemas/lesson-schema';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Grammar notes modal — shows detailed, localized grammar explanations.
 * Hidden by default; opens when the learner requests it.
 */
export function GrammarModal({ note, onClose }: { note: GrammarNote; onClose: () => void }) {
  const { ts } = useI18n();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-secondary-950/60 backdrop-blur-sm animate-fade-in sm:items-center" onClick={onClose}>
      <div className="card max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-b-none p-6 animate-slide-up sm:rounded-3xl sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-100 text-primary-700"><BookOpen size={22} /></div>
            <h2 className="font-display text-xl font-bold text-secondary-900">{note.title}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost px-2 py-2" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="mt-6 space-y-5">
          <GrammarSection icon={<Info size={16} />} label="Explanation" text={ts(note.explanation)} />
          {note.whenToUse && <GrammarSection icon={<Lightbulb size={16} />} label="When to use" text={ts(note.whenToUse)} />}
          {note.structure && <GrammarSection icon={<BookOpen size={16} />} label="Structure" text={ts(note.structure)} />}
          {note.positiveForm && <GrammarSection icon={<CheckCircle2 size={16} />} label="Positive form" text={ts(note.positiveForm)} />}
          {note.negativeForm && <GrammarSection icon={<AlertTriangle size={16} />} label="Negative form" text={ts(note.negativeForm)} />}
          {note.questionForm && <GrammarSection icon={<BookOpen size={16} />} label="Question form" text={ts(note.questionForm)} />}
          {note.exceptions && <GrammarSection icon={<AlertTriangle size={16} />} label="Exceptions" text={ts(note.exceptions)} />}
          {note.commonMistakes && <GrammarSection icon={<AlertTriangle size={16} />} label="Common mistakes" text={ts(note.commonMistakes)} />}
          {note.tips && <GrammarSection icon={<Lightbulb size={16} />} label="Tips" text={ts(note.tips)} />}

          {note.examples && note.examples.length > 0 && (
            <div className="rounded-2xl bg-secondary-50 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-primary-600">Examples</p>
              <ul className="mt-3 space-y-2">
                {note.examples.map((ex, i) => (
                  <li key={i} className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="font-display text-lg font-semibold text-secondary-900">{ex.english}</p>
                    <p className="mt-1 text-sm text-secondary-500">{ts(ex.translation)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GrammarSection({ icon, label, text }: { icon: React.ReactNode; label: string; text: string }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-secondary-100 bg-white">
      <button className="flex w-full items-center justify-between px-4 py-3 text-left" onClick={() => setOpen((v) => !v)}>
        <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-secondary-600">{icon}{label}</span>
        {open ? <ChevronUp size={16} className="text-secondary-400" /> : <ChevronDown size={16} className="text-secondary-400" />}
      </button>
      {open && <p className="px-4 pb-4 leading-7 text-secondary-700">{text}</p>}
    </div>
  );
}

/**
 * A compact grammar button that opens the modal.
 */
export function GrammarButton({ note, label }: { note: GrammarNote; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700" onClick={() => setOpen(true)}>
        <BookOpen size={14} />{label}
      </button>
      {open && <GrammarModal note={note} onClose={() => setOpen(false)} />}
    </>
  );
}
