# Lingua content authoring guide

Lessons are JSON-only. Add files under `src/content/lessons/`; nested folders are supported. The build discovers them automatically through the content manifest. Add or update a unit under `src/content/units/` when you want the lesson grouped in a learning path.

## Complete lesson shape

```json
{
  "schemaVersion": 1,
  "id": "family-lesson-01",
  "unitId": "family",
  "topicId": "family-members",
  "title": "My family",
  "description": { "en": "Talk about the people in your family." },
  "topic": "Family members",
  "category": "Everyday English",
  "cefrLevel": "A1",
  "order": 1,
  "icon": "Users",
  "estimatedDuration": 20,
  "objectives": [{ "en": "Name family members" }],
  "studyCards": [],
  "questions": [],
  "completionRequirements": { "minScorePercent": 70, "requireAllQuestions": true },
  "tts": { "enabled": true, "rate": 0.9 },
  "metadata": { "author": "Lingua" }
}
```

`questions` must contain at least one item. `studyCards`, `vocabulary`, `grammarNotes`, and `prerequisites` may be empty.

## Study cards

A vocabulary card needs a unique `id`, English `word`, `translations`, and `difficulty`.

```json
{
  "kind": "vocabulary",
  "id": "family-mother",
  "word": "mother",
  "translations": { "en": "mother", "ar": "أم", "fr": "mère" },
  "partOfSpeech": "noun",
  "phonetic": "/ˈmʌðə(r)/",
  "imagePath": "/content-assets/family/mother.jpg",
  "imageAlt": "A mother and child",
  "audio": { "url": "/content-assets/family/mother.mp3", "tts": { "enabled": true, "rate": 0.9 } },
  "exampleSentence": "My mother is a teacher.",
  "exampleTranslation": { "en": "My mother is a teacher.", "ar": "أمي معلمة." },
  "usageNotes": { "en": "Mother is more formal than mom." },
  "difficulty": "easy"
}
```

Use `imagePath` and audio `url` for files in `public/content-assets/`. HTTPS image URLs are also supported. If audio is absent or fails, the browser's speech synthesis is used when available. Images show an accessible placeholder when unavailable.

Grammar notes are optional on cards and questions. They support `title`, `explanation`, `whenToUse`, `structure`, `positiveForm`, `negativeForm`, `questionForm`, `exceptions`, `commonMistakes`, `tips`, and an `examples` array containing `english` and translated text. They remain hidden until the learner opens them.

## Practice questions

Questions are discriminated by `type`, so each type has its own answer fields. Supported types are `multiple_choice`, `true_false`, `fill_blank`, `word_bank`, `match_pairs`, `order_words`, `listen_choose`, `listen_type`, `select_image`, and `spell_word`.

Example multiple choice:

```json
{
  "id": "family-mother-choice",
  "type": "multiple_choice",
  "prompt": { "en": "Choose the word for أم", "ar": "اختر الكلمة" },
  "supportingText": { "en": "Look at the family vocabulary." },
  "options": ["mother", "brother", "daughter"],
  "correctIndex": 0,
  "hint": { "en": "This person may care for children." },
  "feedback": { "correct": { "en": "Correct." }, "incorrect": { "en": "Try again." } },
  "difficulty": "easy",
  "points": 10,
  "skill": "vocabulary"
}
```

Never put the answer in the prompt or hint. For `order_words`, every `correctOrder` word must appear in `shuffled`. For multiple-choice types, `correctIndex` must point to an existing option.

## Translations

Every translation object must include English (`en`) for reliable fallback. Add `ar`, `fr`, `hi`, `es`, and `de` when the phrase is ready for those learners. The selected learner language controls the displayed translation.

## Add a lesson

1. Create `src/content/lessons/<topic>/lesson-01.json`.
2. Give the lesson, every study card, and every question a unique ID.
3. Add image and audio files to `public/content-assets/<topic>/` when using local assets.
4. Add the lesson ID to a unit's `lessonIds` list, or create a unit JSON file.
5. Restart or rebuild the app so Vite regenerates the content manifest.

No React page, route, or practice-engine change is needed.

## Troubleshooting

- **Lesson does not appear:** confirm the file ends in `.json`, is under `src/content/lessons/`, has `schemaVersion: 1`, and is referenced by a unit if it should appear in that unit.
- **Lesson is omitted:** open the content warning area. It reports the file, field, and validation message instead of crashing the app.
- **Image placeholder appears:** check the path starts with `/content-assets/` and that the file exists under `public/content-assets/`, or use a valid HTTPS URL.
- **Audio does not play:** check the audio URL and browser permissions. TTS is the fallback when enabled.
- **Translation is blank:** add an English value and confirm the selected locale has a translation or a deliberate English fallback.
- **JSON error:** validate commas, quotes, brackets, and duplicate keys. Keep strings in double quotes.

The complete realistic example is `src/content/lessons/family/lesson-01.json`.
