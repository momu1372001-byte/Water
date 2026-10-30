# Lingua architecture

Lingua is a JSON-first English learning application. Educational authors work in content files; the React experience, practice engine, and study-card engine remain reusable.

## Project boundaries

- `src/content/`: versioned lesson and unit JSON plus Zod schemas.
- `src/engine/`: content loading and answer evaluation. It contains no lesson-specific UI.
- `src/i18n/`: interface translations and locale direction handling.
- `src/hooks/`: React access to content, authentication, and progress.
- `src/services/`: Supabase client and persistence operations.
- `src/App.tsx`: responsive application shell and reusable route-level views.
- `supabase/migrations/`: the progress and preference tables with owner-scoped RLS.

## Adding a lesson

1. Copy `src/content/lessons/hello-world.json`.
2. Give it a unique `id`, update its metadata, and keep `schemaVersion: 1`.
3. Add the required English text and any available learner-language translations.
4. Use an existing `type` for each question. Existing question types need JSON only.
5. Add the lesson id to a unit's `lessonIds` array, or create a new unit JSON file.
6. Run `npm run typecheck`, `npm run test`, and `npm run build`.

The Vite content-manifest plugin scans the lesson and unit directories at build/dev time. It generates a virtual module with static JSON imports. This avoids unreliable arbitrary dynamic imports from a public directory. A malformed file is excluded from the valid catalog and reported with its path and exact Zod field errors by the content loader.

## Validation and versioning

Every lesson and unit is checked against a Zod schema. The top-level `schemaVersion` is an exact version gate. A future breaking schema can add a migration layer before parsing or introduce a new schema version without changing the practice UI. Optional fields use defaults where the engine can safely continue.

## Practice and study engines

The practice route receives a validated `Lesson`. It renders generic controls based on the question discriminator (`multiple_choice`, `true_false`, `fill_blank`, `order_words`, and more). `evaluateAnswer` owns answer normalization and scoring. Adding another question of an existing type is content-only; adding a new type requires one schema variant, one evaluator branch, and one reusable renderer capability.

The study route receives the same lesson and renders its validated `studyCards`. A card can be vocabulary, grammar, or sentence content. The learner may skip this route and enter practice directly.

## Learner language

The interface locale is stored locally immediately and supports English, Arabic, French, Hindi, Spanish, and German. `I18nProvider` sets the document language and direction (`ltr` or `rtl`). Content translations are locale maps with English fallback, so English learning material remains English while explanations and labels adapt.

## Progress and Supabase

Authentication uses Supabase email/password sessions. `lesson_progress` is owner-scoped by `auth.uid()` and has four separate CRUD policies. The frontend upserts a user's row for each lesson and keeps the best score. `user_preferences` stores the interface locale for cross-device synchronization. The browser uses the anon key; RLS is the security boundary.

The current sign-in UI is optional for browsing and practice, but signing in is required for cloud progress. If a learner practices while signed out, the result can be displayed but cannot be synchronized.

## Future packs and AI

Content packs can be represented as additional manifest roots or a downloadable pack registry whose files are validated through the same schemas. AI features should be added as a service boundary returning validated exercise or feedback DTOs. They should not write directly into React views or bypass the content schema. Generated content can be reviewed, versioned, and inserted into a pack before it becomes available to learners.

## Current scope

Implemented: application shell, responsive visual system, routing, JSON discovery, runtime validation, locale switching with RTL, Supabase auth client, progress schema and RLS, study cards, generic practice controls for the initial question types, sample content, and automated tests.

Not implemented yet: the final 28-question blueprint, audio asset hosting, image-rich question renderer, adaptive difficulty model, analytics dashboards, offline downloadable packs, native Capacitor project files, and production content authoring tools.
