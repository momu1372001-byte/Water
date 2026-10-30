import { useState, type FormEvent, type ReactNode } from 'react';
import { BrowserRouter, Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, Check, ChevronRight, CircleHelp, Eye, EyeOff, Globe2, Headphones, Home, LogIn, LogOut, Menu, Play, Sparkles, Star, Target, Trophy, UserRound, X, Zap } from 'lucide-react';
import type { Question, StudyCard, Lesson, GrammarNote } from '@/content/schemas/lesson-schema';
import { getLessonById, getLessonsForUnit } from '@/engine/content-loader';
import { evaluateAnswer } from '@/engine/practice-engine';
import { useContent } from '@/hooks/useContent';
import { useStudyProgress } from '@/hooks/useStudyProgress';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { I18nProvider, useI18n } from '@/i18n/I18nContext';
import { LOCALES } from '@/lib/locales';
import { SmartImage } from '@/components/SmartImage';
import { GrammarModal, GrammarButton } from '@/components/GrammarModal';

function App() {
  return <I18nProvider><AuthProviderShell /></I18nProvider>;
}

function AuthProviderShell() {
  return <BrowserRouter><AuthProvider><AppShell /></AuthProvider></BrowserRouter>;
}

function AppShell() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigation = [
    { to: '/', label: t('nav.home'), icon: Home },
    { to: '/lessons', label: t('nav.lessons'), icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-secondary-50">
      <header className="sticky top-0 z-40 border-b border-secondary-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-600 text-white shadow-glow"><Sparkles size={22} /></div>
            <div><div className="font-display text-xl font-bold tracking-tight text-secondary-900">Lingua</div><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-600">{t('app.tagline')}</div></div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navigation.map(({ to, label, icon: Icon }) => <NavItem key={to} to={to} label={label} icon={<Icon size={17} />} />)}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <LanguagePicker />
            {user ? <button className="btn-ghost px-4 py-2" onClick={() => void signOut()}><LogOut size={17} />{t('nav.signout')}</button> : <Link className="btn-primary px-4 py-2.5" to="/auth"><LogIn size={17} />{t('nav.signin')}</Link>}
          </div>
          <button className="btn-ghost px-3 md:hidden" aria-label="Open menu" onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X /> : <Menu />}</button>
        </div>
        {mobileOpen && <div className="border-t border-secondary-100 bg-white px-4 py-4 md:hidden"><div className="flex flex-col gap-2">{navigation.map(({ to, label, icon: Icon }) => <NavItem key={to} to={to} label={label} icon={<Icon size={17} />} onClick={() => setMobileOpen(false)} />)}<div className="mt-2 border-t border-secondary-100 pt-3"><LanguagePicker />{user ? <button className="btn-ghost mt-2 w-full justify-start" onClick={() => void signOut()}><LogOut size={17} />{t('nav.signout')}</button> : <Link className="btn-primary mt-2 w-full" to="/auth">{t('nav.signin')}</Link>}</div></div></div>}
      </header>
      <main><Routes><Route path="/" element={<HomePage />} /><Route path="/lessons" element={<LessonsPage />} /><Route path="/lessons/:lessonId" element={<LessonPage />} /><Route path="/lessons/:lessonId/study" element={<StudyPage />} /><Route path="/lessons/:lessonId/practice" element={<PracticePage />} /><Route path="/auth" element={<AuthPage />} /><Route path="*" element={<NotFound />} /></Routes></main>
      <footer className="border-t border-secondary-100 bg-white"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-secondary-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8"><span>© 2026 Lingua</span><span className="flex items-center gap-2"><Globe2 size={15} />{t('app.tagline')}</span></div></footer>
    </div>
  );
}

function NavItem({ to, label, icon, onClick }: { to: string; label: string; icon: ReactNode; onClick?: () => void }) {
  return <NavLink to={to} onClick={onClick} className={({ isActive }) => `flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'bg-primary-50 text-primary-700' : 'text-secondary-600 hover:bg-secondary-100'}`}>{icon}{label}</NavLink>;
}

function LanguagePicker() {
  const { locale, setLocale } = useI18n();
  return <label className="flex items-center gap-2 rounded-xl border border-secondary-200 bg-white px-3 py-2 text-sm font-medium text-secondary-700"><Globe2 size={16} className="text-primary-600" /><select value={locale} onChange={(event) => setLocale(event.target.value)} className="bg-transparent outline-none"><optgroup label="Language">{LOCALES.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</optgroup></select></label>;
}

function HomePage() {
  const { t } = useI18n();
  const { lessons, units, errors } = useContent();
  const { progress } = useProgress();
  const firstLesson = lessons[0]?.data;
  const completed = Object.values(progress).filter((item) => item.status === 'completed').length;
  return <div className="hero-gradient"><section className="mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-24 lg:pt-24"><div className="animate-slide-up self-center"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700"><Zap size={15} fill="currentColor" />A calmer way to learn</div><h1 className="max-w-3xl font-display text-5xl font-bold leading-[1.08] tracking-tight text-secondary-950 sm:text-6xl">English that stays with you.</h1><p className="mt-6 max-w-xl text-lg leading-8 text-secondary-600">Build real confidence through beautifully focused lessons, useful conversations, and practice that meets you where you are.</p><div className="mt-8 flex flex-wrap gap-3">{firstLesson && <Link to={`/lessons/${firstLesson.id}`} className="btn-primary"><Play size={18} fill="currentColor" />{t('lesson.start')}</Link>}<Link to="/lessons" className="btn-secondary"><BookOpen size={18} />{t('nav.lessons')}</Link></div><div className="mt-10 flex flex-wrap gap-8 text-sm"><Stat value={`${lessons.length}`} label="available lessons" /><Stat value={`${completed}`} label="lessons completed" /><Stat value="A1–C2" label="CEFR pathway" /></div></div><div className="relative animate-scale-in"><div className="absolute -inset-5 rounded-[2.5rem] bg-primary-100/60 blur-2xl"/><div className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-secondary-950 p-7 text-white shadow-2xl sm:p-9"><div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary-500/20 blur-3xl"/><div className="relative"><div className="flex items-center justify-between"><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary-200">Your learning space</span><Trophy className="text-accent-400" size={22} /></div><div className="mt-16"><p className="text-sm text-secondary-300">Today’s focus</p><h2 className="mt-2 font-display text-3xl font-bold">Small talk, big progress.</h2><p className="mt-3 max-w-sm text-secondary-300">One useful conversation at a time. Keep your streak gentle and your goals clear.</p></div><div className="mt-10 rounded-2xl bg-white/10 p-4"><div className="flex items-center justify-between text-sm"><span className="font-medium">Pathway progress</span><span className="text-primary-200">{units.length ? `${completed}/${lessons.length}` : '0/0'}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-primary-400 transition-all" style={{ width: lessons.length ? `${(completed / lessons.length) * 100}%` : '0%' }} /></div></div></div></div></div></section>{errors.length > 0 && <ContentWarning count={errors.length} />}</div>;
}

function Stat({ value, label }: { value: string; label: string }) { return <div><div className="font-display text-2xl font-bold text-secondary-900">{value}</div><div className="mt-1 text-secondary-500">{label}</div></div>; }
function ContentWarning({ count }: { count: number }) { const { t } = useI18n(); return <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8"><div className="flex items-center gap-3 rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800"><CircleHelp size={18} />{t('error.contentLoadFailed')} ({count})</div></div>; }

function LessonsPage() {
  const { t, ts } = useI18n(); const { lessons, units } = useContent(); const { progress } = useProgress();
  return <PageContainer><PageHeading eyebrow="Learning pathway" title={t('nav.lessons')} description="Choose a lesson, review the ideas, then practise at your own pace." />{units.map((unitEntry) => { const unit = unitEntry.data; const unitLessons = getLessonsForUnit(lessons, unit); return <section key={unit.id} className="mt-10"><div className="mb-5 flex items-end justify-between"><div><p className="text-sm font-semibold uppercase tracking-widest text-primary-600">Unit · {unit.cefrLevel}</p><h2 className="mt-2 font-display text-2xl font-bold text-secondary-900">{unit.title}</h2><p className="mt-1 text-secondary-500">{ts(unit.description)}</p></div><span className="hidden text-sm text-secondary-400 sm:block">{unitLessons.length} {t('unit.lessons')}</span></div><div className="grid gap-4 md:grid-cols-2">{unitLessons.map((lesson, index) => <LessonCard key={lesson.id} lesson={lesson} index={index} completed={progress[lesson.id]?.status === 'completed'} bestScore={progress[lesson.id]?.bestScorePercent} />)}</div></section>; })}{units.length === 0 && <EmptyState />}</PageContainer>;
}

function LessonCard({ lesson, index, completed, bestScore }: { lesson: Lesson; index: number; completed: boolean; bestScore: number | null | undefined }) { const { t } = useI18n(); return <Link to={`/lessons/${lesson.id}`} className="card group flex items-center gap-5 p-5 transition duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-glow"><div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl font-display text-xl font-bold ${completed ? 'bg-success-100 text-success-700' : 'bg-primary-50 text-primary-700'}`}>{completed ? <Check size={24} /> : String(index + 1).padStart(2, '0')}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-secondary-600">{lesson.cefrLevel}</span>{completed && <span className="rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-bold text-success-700">{bestScore}% best</span>}</div><h3 className="mt-2 truncate font-display text-lg font-bold text-secondary-900 group-hover:text-primary-700">{lesson.title}</h3><p className="mt-1 truncate text-sm text-secondary-500">{lesson.subtitle}</p><div className="mt-3 flex items-center gap-3 text-xs font-medium text-secondary-400"><span>{lesson.questions.length} {t('lesson.questions')}</span><span>·</span><span>{lesson.topic}</span></div></div><ChevronRight className="shrink-0 text-secondary-300 transition group-hover:translate-x-1 group-hover:text-primary-600" size={22} /></Link>; }

function LessonPage() {
  const { lessonId } = useParams();
  const { lessons } = useContent();
  const { t, ts } = useI18n();
  const lesson = lessonId ? getLessonById(lessons, lessonId) : null;
  if (!lesson) return <NotFound />;
  return <PageContainer><Link to="/lessons" className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-500 hover:text-primary-700"><ArrowLeft size={16} />{t('lesson.backToLessons')}</Link><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"><div><span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-700">{lesson.cefrLevel} · {lesson.category}</span><h1 className="mt-5 font-display text-5xl font-bold tracking-tight text-secondary-950">{lesson.title}</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-secondary-600">{lesson.subtitle}</p><div className="mt-10 card p-6"><h2 className="font-display text-lg font-bold text-secondary-900">{t('lesson.objectives')}</h2><ul className="mt-4 space-y-3">{lesson.objectives.map((objective, index) => <li key={index} className="flex gap-3 text-secondary-600"><span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-700"><Check size={13} /></span>{ts(objective)}</li>)}</ul></div></div><div className="card h-fit bg-secondary-950 p-6 text-white shadow-2xl"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-500/20 text-primary-300"><Target size={28} /></div><h2 className="mt-7 font-display text-2xl font-bold">Ready when you are.</h2><p className="mt-3 leading-7 text-secondary-300">Study first or jump straight into practice. Both use the same lesson content.</p><div className="mt-7 space-y-3"><Link to={`/lessons/${lesson.id}/practice`} className="btn-primary w-full"><Play size={18} fill="currentColor" />{t('lesson.practice')}</Link><Link to={`/lessons/${lesson.id}/study`} className="btn-secondary w-full border-white/15 bg-white/10 text-white hover:bg-white/15"><BookOpen size={18} />{t('lesson.study')}</Link></div><div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-secondary-300"><span>{lesson.questions.length} {t('lesson.questions')}</span><span>{lesson.vocabulary.length} {t('lesson.vocabulary')}</span></div></div></div></PageContainer>;
}

function StudyPage() {
  const { lessonId } = useParams();
  const { lessons } = useContent();
  const lesson = lessonId ? getLessonById(lessons, lessonId) : null;
  if (!lesson) return <NotFound />;
  return <StudyExperience lesson={lesson} />;
}

function StudyExperience({ lesson }: { lesson: Lesson }) {
  const { t, ts } = useI18n();
  const navigate = useNavigate();
  const cards = lesson.studyCards;
  const { index, goTo, toggleBookmark, toggleKnown, getCardState } = useStudyProgress(lesson.id, cards.length);
  const [flipped, setFlipped] = useState(false);
  const [showSentenceTranslation, setShowSentenceTranslation] = useState(false);
  const [grammarNote, setGrammarNote] = useState<GrammarNote | null>(null);
  const wordAudio = useAudioPlayer();
  const sentenceAudio = useAudioPlayer();
  const card = cards[index];
  const isLastCard = index >= cards.length - 1;
  const cardState = card ? getCardState(card.id) : null;

  const move = (delta: number) => {
    setFlipped(false);
    setShowSentenceTranslation(false);
    goTo(index + delta);
  };

  if (cards.length === 0) return <PageContainer narrow><EmptyState /></PageContainer>;

  return (
    <PageContainer narrow>
      <div className="flex items-center justify-between">
        <Link to={`/lessons/${lesson.id}`} className="btn-ghost px-0"><ArrowLeft size={17} />{t('common.back')}</Link>
        <span className="text-sm font-semibold text-secondary-500">{index + 1} {t('study.cardOf')} {cards.length}</span>
      </div>
      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-secondary-100">
        <div className="h-full rounded-full bg-primary-400 transition-all duration-500" style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-600">{t('study.title')}</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-secondary-950">{lesson.title}</h1>
        <p className="mt-2 text-secondary-500">{t('study.subtitle')}</p>
      </div>

      {/* Card with 3D flip */}
      <div className="mt-8 [perspective:1200px]">
        <div
          className={`relative min-h-[420px] w-full cursor-pointer transition-transform duration-600 [transform-style:preserve-3d] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}
          onClick={() => setFlipped((v) => !v)}
        >
          {/* Front face */}
          <div className="absolute inset-0 flex flex-col rounded-[2rem] border border-secondary-100 bg-white p-6 shadow-card [backface-visibility:hidden]">
            {card.kind === 'vocabulary' && (
              <VocabCardFront
                card={card}
                ts={ts}
                t={t}
                showSentenceTranslation={showSentenceTranslation}
                onToggleSentence={() => setShowSentenceTranslation((v) => !v)}
                wordAudio={wordAudio}
                sentenceAudio={sentenceAudio}
                onGrammar={() => card.grammar && setGrammarNote(card.grammar)}
              />
            )}
            {card.kind === 'grammar' && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-700">Grammar</span>
                <h2 className="mt-6 font-display text-3xl font-bold text-secondary-900">{card.front}</h2>
                <p className="mt-4 text-sm text-secondary-400">{t('study.flip')}</p>
                {card.grammar && <div className="mt-4"><GrammarButton note={card.grammar} label={t('study.grammar')} /></div>}
              </div>
            )}
            {card.kind === 'sentence' && (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-700">Sentence</span>
                <h2 className="mt-6 font-display text-2xl font-bold text-secondary-900">{card.front}</h2>
                <button
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-600"
                  onClick={(e) => { e.stopPropagation(); sentenceAudio.play(card.audio, card.front); }}
                >
                  <Headphones size={16} />{t('study.listenSentence')}
                </button>
                <p className="mt-4 text-sm text-secondary-400">{t('study.flip')}</p>
              </div>
            )}
          </div>

          {/* Back face */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[2rem] bg-primary-600 p-8 text-center text-white shadow-card [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary-100">{card.kind}</span>
            {card.kind === 'vocabulary' && (
              <>
                <h2 className="mt-7 max-w-xl font-display text-4xl font-bold">{ts(card.translations)}</h2>
                {card.phonetic && <p className="mt-3 text-lg text-primary-200">{card.phonetic}</p>}
                {card.usageNotes && <p className="mt-4 max-w-md leading-7 text-primary-100">{ts(card.usageNotes)}</p>}
                {card.grammar && <div className="mt-5"><GrammarButton note={card.grammar} label={t('study.grammar')} /></div>}
                <p className="mt-6 text-sm text-primary-200">{t('study.flip')}</p>
              </>
            )}
            {card.kind === 'grammar' && (
              <>
                <h2 className="mt-7 max-w-xl font-display text-3xl font-bold">{ts(card.back)}</h2>
                {card.examples && card.examples.length > 0 && (
                  <div className="mt-5">
                    {card.examples.map((ex, i) => (
                      <p key={i} className="mt-2 text-sm text-primary-100">{ex.english} — {ts(ex.translation)}</p>
                    ))}
                  </div>
                )}
                <p className="mt-6 text-sm text-primary-200">{t('study.flip')}</p>
              </>
            )}
            {card.kind === 'sentence' && (
              <>
                <h2 className="mt-7 max-w-xl font-display text-2xl font-bold">{ts(card.back)}</h2>
                <p className="mt-6 text-sm text-primary-200">{t('study.flip')}</p>
              </>
            )}
          </div>
        </div>
      </div>
      <p className="mt-4 text-center text-sm text-secondary-400">{t('study.flip')}</p>

      {/* Card controls: bookmark, known/difficult */}
      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${cardState?.bookmarked ? 'bg-accent-100 text-accent-700' : 'text-secondary-500 hover:bg-secondary-100'}`}
          onClick={(e) => { e.stopPropagation(); toggleBookmark(card.id); }}
        >
          {cardState?.bookmarked ? <Bookmark size={16} fill="currentColor" /> : <Bookmark size={16} />}
          {cardState?.bookmarked ? t('study.bookmarked') : t('study.bookmark')}
        </button>
        <button
          className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${cardState?.known ? 'bg-success-100 text-success-700' : 'text-secondary-500 hover:bg-secondary-100'}`}
          onClick={(e) => { e.stopPropagation(); toggleKnown(card.id); }}
        >
          {cardState?.known ? <Check size={16} /> : <Star size={16} />}
          {cardState?.known ? t('study.markKnownUndo') : t('study.markKnown')}
        </button>
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-center gap-3">
        <button className="btn-secondary" onClick={() => move(-1)} disabled={index === 0}>
          <ArrowLeft size={17} />{t('study.prev')}
        </button>
        {isLastCard ? (
          <button className="btn-primary" onClick={() => navigate(`/lessons/${lesson.id}/practice`)}>
            {t('study.startPractice')}<ArrowRight size={17} />
          </button>
        ) : (
          <button className="btn-primary" onClick={() => move(1)}>
            {t('study.next')}<ArrowRight size={17} />
          </button>
        )}
      </div>
      <button onClick={() => navigate(`/lessons/${lesson.id}/practice`)} className="mx-auto mt-5 block text-sm font-semibold text-secondary-500 underline decoration-secondary-200 underline-offset-4 hover:text-primary-700">
        {t('study.skipToPractice')}
      </button>

      {grammarNote && <GrammarModal note={grammarNote} onClose={() => setGrammarNote(null)} />}
    </PageContainer>
  );
}

function VocabCardFront({
  card, ts, t, showSentenceTranslation, onToggleSentence, wordAudio, sentenceAudio, onGrammar,
}: {
  card: Extract<StudyCard, { kind: 'vocabulary' }>;
  ts: (v: Record<string, string> | undefined, fb?: string) => string;
  t: (k: import('@/lib/translation-keys').TranslationKey) => string;
  showSentenceTranslation: boolean;
  onToggleSentence: () => void;
  wordAudio: ReturnType<typeof useAudioPlayer>;
  sentenceAudio: ReturnType<typeof useAudioPlayer>;
  onGrammar: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col" onClick={(e) => e.stopPropagation()}>
      {/* Image */}
      {card.imagePath && (
        <SmartImage path={card.imagePath} alt={card.imageAlt ?? card.word} className="aspect-[4/3] w-full" rounded="rounded-2xl" />
      )}

      {/* Word with audio button */}
      <div className="mt-5 flex items-center justify-center gap-3">
        <h2 className="font-display text-4xl font-bold text-secondary-900">{card.word}</h2>
        <button
          className={`grid h-11 w-11 place-items-center rounded-full transition ${wordAudio.playing ? 'bg-primary-600 text-white animate-pulse' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'}`}
          onClick={() => wordAudio.play(card.audio ?? card.audioUrl ? { url: card.audioUrl } : undefined, card.word)}
          aria-label={t('study.listenWord')}
          disabled={wordAudio.playing}
        >
          <Headphones size={20} />
        </button>
      </div>

      {/* Phonetic */}
      {card.phonetic && <p className="mt-2 text-center text-lg text-primary-600">{card.phonetic}</p>}

      {/* Part of speech */}
      {card.partOfSpeech && <p className="mt-1 text-center text-sm italic text-secondary-400">{card.partOfSpeech}</p>}

      {/* Example sentence with audio + reveal translation */}
      {card.exampleSentence && (
        <div className="mt-5 rounded-2xl bg-secondary-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-lg font-semibold leading-7 text-secondary-800">{card.exampleSentence}</p>
            <button
              className="shrink-0 rounded-lg p-1.5 text-primary-500 hover:bg-primary-50"
              onClick={() => sentenceAudio.play(card.audio ?? card.audioUrl ? { url: card.audioUrl } : undefined, card.exampleSentence)}
              aria-label={t('study.listenSentence')}
              disabled={sentenceAudio.playing}
            >
              <Headphones size={18} className={sentenceAudio.playing ? 'animate-pulse' : ''} />
            </button>
          </div>
          {showSentenceTranslation && card.exampleTranslation && (
            <p className="mt-2 border-t border-secondary-200 pt-2 text-sm text-secondary-600">{ts(card.exampleTranslation)}</p>
          )}
          <button
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700"
            onClick={onToggleSentence}
          >
            {showSentenceTranslation ? <><EyeOff size={14} />{t('study.hideTranslation')}</> : <><Eye size={14} />{t('study.revealTranslation')}</>}
          </button>
        </div>
      )}

      {/* Grammar notes button */}
      {card.grammar && (
        <div className="mt-4 text-center">
          <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700" onClick={onGrammar}>
            <BookOpen size={14} />{t('study.grammar')}
          </button>
        </div>
      )}
    </div>
  );
}

function PracticePage() { const { lessonId } = useParams(); const { lessons } = useContent(); const lesson = lessonId ? getLessonById(lessons, lessonId) : null; if (!lesson) return <NotFound />; return <PracticeExperience lesson={lesson} />; }

function PracticeExperience({ lesson }: { lesson: Lesson }) { const { t, ts } = useI18n(); const navigate = useNavigate(); const { saveProgress } = useProgress(); const questions = lesson.questions; const [index, setIndex] = useState(0); const [answer, setAnswer] = useState<unknown>(''); const [checked, setChecked] = useState(false); const [results, setResults] = useState<boolean[]>([]); const question = questions[index]; const result = checked ? evaluateAnswer(question, answer) : null; const submit = async () => { if (!checked) { setChecked(true); const next = [...results, evaluateAnswer(question, answer).correct]; setResults(next); return; } if (index < questions.length - 1) { setIndex((value) => value + 1); setAnswer(''); setChecked(false); return; } const score = Math.round((results.filter(Boolean).length / questions.length) * 100); await saveProgress(lesson.id, 'completed', score, questions.length, results.filter(Boolean).length); navigate(`/lessons/${lesson.id}`); }; const exit = () => navigate(`/lessons/${lesson.id}`); return <PageContainer narrow><div className="flex items-center justify-between"><button className="btn-ghost px-0" onClick={exit}><X size={17} />{t('practice.exit')}</button><span className="text-sm font-semibold text-secondary-500">{index + 1} {t('practice.questionOf')} {questions.length}</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary-100"><div className="h-full rounded-full bg-primary-500 transition-all duration-500" style={{ width: `${((index + (checked ? 1 : 0)) / questions.length) * 100}%` }} /></div><div className="mt-12"><p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-600">{lesson.title}</p><h1 className="mt-4 font-display text-3xl font-bold leading-tight text-secondary-950">{ts(question.prompt)}</h1><div className="mt-8">{question.type === 'multiple_choice' && <Options options={question.options} value={answer as number} onChange={setAnswer} checked={checked} correctIndex={question.correctIndex} />}{question.type === 'true_false' && <Options options={['True', 'False']} value={answer as number} onChange={setAnswer} checked={checked} correctIndex={question.isTrue ? 0 : 1} />}{question.type === 'fill_blank' && <TextAnswer template={question.sentenceTemplate} value={String(answer)} onChange={setAnswer} disabled={checked} />}{question.type === 'spell_word' && <TextAnswer template="Type the word you hear or see." value={String(answer)} onChange={setAnswer} disabled={checked} />}{question.type === 'order_words' && <WordOrder question={question} answer={answer as string[]} onChange={setAnswer} checked={checked} />}</div>{checked && <div className={`mt-7 rounded-2xl border p-5 ${result?.correct ? 'border-success-200 bg-success-50 text-success-800' : 'border-error-200 bg-error-50 text-error-800'}`}><div className="flex items-center gap-2 font-bold">{result?.correct ? <Check size={18} /> : <CircleHelp size={18} />}{result?.correct ? t('practice.correct') : t('practice.incorrect')}</div>{!result?.correct && <p className="mt-2 text-sm">{t('practice.correctAnswer')}: <strong>{result?.correctAnswer}</strong></p>}</div>}<div className="mt-8 flex items-center justify-between gap-3">{question.hint && !checked ? <button className="btn-ghost px-0 text-primary-700" onClick={() => window.alert(ts(question.hint))}><CircleHelp size={17} />{t('practice.showHint')}</button> : <span />}{<button className="btn-primary" disabled={!checked && (answer === '' || (Array.isArray(answer) && answer.length === 0))} onClick={() => void submit()}>{checked ? (index === questions.length - 1 ? t('common.finish') : t('practice.continue')) : t('practice.check')}<ArrowRight size={17} /></button>}</div></div></PageContainer>; }

function Options({ options, value, onChange, checked, correctIndex }: { options: string[]; value: number; onChange: (value: number) => void; checked: boolean; correctIndex: number }) { return <div className="grid gap-3">{options.map((option, optionIndex) => <button key={option} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left font-semibold transition ${checked && optionIndex === correctIndex ? 'border-success-300 bg-success-50 text-success-800' : checked && optionIndex === value ? 'border-error-300 bg-error-50 text-error-800' : value === optionIndex ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-secondary-200 bg-white text-secondary-700 hover:border-primary-300 hover:bg-primary-50'}`} onClick={() => !checked && onChange(optionIndex)} disabled={checked}><span className="grid h-8 w-8 place-items-center rounded-xl bg-secondary-100 text-sm text-secondary-500">{String.fromCharCode(65 + optionIndex)}</span>{option}{checked && optionIndex === correctIndex && <Check className="ml-auto" size={18} />}</button>)}</div>; }
function TextAnswer({ template, value, onChange, disabled }: { template: string; value: string; onChange: (value: string) => void; disabled: boolean }) { return <div><p className="mb-4 rounded-2xl bg-secondary-100 p-5 font-display text-xl font-semibold text-secondary-800">{template}</p><input autoFocus value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} className="input-field text-lg" placeholder="Type your answer..." /></div>; }
function WordOrder({ question, answer, onChange, checked }: { question: Extract<Question, { type: 'order_words' }>; answer: string[]; onChange: (value: string[]) => void; checked: boolean }) { const selected = answer ?? []; const remaining = question.shuffled.filter((word, index) => selected.indexOf(word) < 0 || selected.filter((item) => item === word).length < question.shuffled.filter((item) => item === word).length - question.shuffled.slice(0, index).filter((item) => item === word).length); return <div><div className="mb-6 min-h-16 rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50 p-4 text-lg font-semibold text-primary-900">{selected.join(' ') || 'Tap words below to build the sentence'}</div><div className="flex flex-wrap gap-3">{remaining.map((word, index) => <button key={`${word}-${index}`} disabled={checked} onClick={() => onChange([...selected, word])} className="rounded-xl border border-secondary-200 bg-white px-4 py-3 font-semibold text-secondary-700 shadow-sm hover:border-primary-300">{word}</button>)}</div>{selected.length > 0 && !checked && <button className="mt-4 text-sm font-semibold text-secondary-500 underline" onClick={() => onChange([])}>Clear</button>}</div>; }

function AuthPage() { const { t } = useI18n(); const { user, signIn, signUp } = useAuth(); const navigate = useNavigate(); const [mode, setMode] = useState<'signin' | 'signup'>('signin'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false); if (user) { navigate('/'); return null; } const submit = async (event: FormEvent) => { event.preventDefault(); setError(''); setLoading(true); const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password); setLoading(false); if (result.error) setError(result.error); else navigate('/'); }; return <PageContainer narrow><div className="mx-auto max-w-md"><div className="mb-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-600 text-white shadow-glow"><UserRound size={25} /></div><h1 className="mt-6 font-display text-3xl font-bold text-secondary-950">{mode === 'signin' ? t('auth.signinPrompt') : t('auth.signupPrompt')}</h1><p className="mt-2 text-secondary-500">{mode === 'signin' ? t('auth.signin') : t('auth.signup')}</p></div><form onSubmit={(event) => void submit(event)} className="card p-6 sm:p-8"><label className="block text-sm font-semibold text-secondary-700">{t('auth.email')}<input className="input-field mt-2" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label className="mt-5 block text-sm font-semibold text-secondary-700">{t('auth.password')}<input className="input-field mt-2" type="password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error && <p className="mt-4 rounded-xl bg-error-50 p-3 text-sm text-error-700">{error}</p>}<button className="btn-primary mt-6 w-full" disabled={loading}>{loading ? t('auth.loading') : mode === 'signin' ? t('auth.signinButton') : t('auth.signupButton')}<ArrowRight size={17} /></button></form><p className="mt-6 text-center text-sm text-secondary-500">{mode === 'signin' ? t('auth.noAccount') : t('auth.haveAccount')} <button className="font-bold text-primary-700 underline underline-offset-4" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>{mode === 'signin' ? t('auth.signup') : t('auth.signin')}</button></p></div></PageContainer>; }

function PageContainer({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) { return <div className={`mx-auto min-h-[calc(100vh-9rem)] px-4 py-10 sm:px-6 lg:px-8 lg:py-16 ${narrow ? 'max-w-3xl' : 'max-w-7xl'}`}>{children}</div>; }
function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div className="max-w-2xl"><p className="text-sm font-bold uppercase tracking-[0.2em] text-primary-600">{eyebrow}</p><h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-secondary-950 sm:text-5xl">{title}</h1><p className="mt-4 text-lg leading-8 text-secondary-600">{description}</p></div>; }
function EmptyState() { const { t } = useI18n(); return <div className="card mt-10 p-10 text-center"><BookOpen className="mx-auto text-secondary-300" size={38} /><h2 className="mt-4 font-display text-xl font-bold text-secondary-800">{t('error.noLessons')}</h2></div>; }
function NotFound() { return <PageContainer narrow><div className="card p-12 text-center"><CircleHelp className="mx-auto text-primary-500" size={42} /><h1 className="mt-5 font-display text-3xl font-bold text-secondary-900">Page not found</h1><Link to="/" className="btn-primary mt-7">Back home</Link></div></PageContainer>; }

export default App;
