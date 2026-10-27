# Prompt: tính năng "Học thuộc" từ vựng

Dán vào Claude Code (hoặc công cụ vibe code) đang mở repo `Quyettam`, nhánh `claude/english-phrase-app`.
Prompt viết cho app đã có sẵn, nên công cụ sẽ sửa code hiện tại thay vì làm app mới.

```text
Add a "Học thuộc" (memorize) feature to the EXISTING phrase-learning PWA in this repo.
Read these files first and follow their patterns (Tailwind tokens in src/index.css, components in
src/components, Dexie in src/lib/db.ts, SM-2 in src/lib/srs.ts + src/lib/study.ts, backup in src/lib/backup.ts):
src/lib/types.ts, src/lib/db.ts, src/lib/study.ts, src/components/ReviewSession.tsx, src/components/BottomNav.tsx,
src/pages/HomePage.tsx, src/pages/SettingsPage.tsx, docs/huong-dan.md.
ALL UI TEXT IN VIETNAMESE. English appears only in learning content. Mobile-first, 44px tap targets,
light/dark mode via the existing CSS tokens, lucide-react icons (emoji only as phrase content).

## Goal
Today the learner can recognise phrases (flip cards, self-graded). Add ACTIVE RECALL drills so they
can produce each phrase from memory: spell it, build it, hear it and write it.

## Mastery ladder (per phrase)
- New Dexie table `mastery`: { key: `${unitId}:${phraseId}`, unitId, level: 0..5, correct, wrong, lastPracticed, starred }.
- Bump Dexie to version(2) adding ONLY the new table. Existing user data must survive the upgrade.
  Add 'mastery' to TABLES so backup export/import includes it; old backups without it must still import.
- Correct answer → level + 1 (max 5). Wrong → level − 1 (min 0). "Gần đúng" (small typo) → level unchanged.
- Level 5 = "Đã thuộc". Phrases enter the ladder after the unit's "Học" step is done (same rule as review cards).

## Exercise types (pick by level, easiest first)
- Level 0–1, recognise:
  1. Trắc nghiệm VI → EN: show emoji + Vietnamese meaning, choose the English phrase out of 4.
  2. Nghe chọn nghĩa: auto-play the English (TTS), choose the Vietnamese meaning out of 4.
  Distractors come from the same unit (fall back to other units), never duplicates of the answer.
- Level 2–3, partial recall:
  3. Sắp xếp từ: shuffled word tiles of the phrase, tap to build it in order (tap a placed tile to remove it).
  4. Điền chỗ trống: hide the key word (longest word that is not a/an/the/on/in/at/of/to/one's).
     Use a book example sentence when the key word appears in it literally, otherwise the phrase itself.
     Show the Vietnamese meaning as a hint. User types the missing word.
- Level 4–5, full recall:
  5. Gõ cả cụm: show emoji + Vietnamese situation, type the whole English phrase.
  6. Nghe chép chính tả: play the phrase (with a 🐢 slow button), type what you hear.
- Also a separate mini-game:
  7. Ghép cặp: 5 English and 5 Vietnamese tiles, tap one from each side to match; wrong pair shakes briefly.

## Answer checking (pure function in src/lib/answer-check.ts, with unit tests)
- Normalise: lowercase, trim, collapse spaces, curly ’ → ', drop trailing . ! ?, "a.m." = "am".
- "one's" in the phrase accepts my / your / his / her / our / their / one's.
- "(the)" style optional words may be omitted. Any entry in `variants` is also correct.
- Result: 'correct' | 'near' (Levenshtein distance ≤ 1 per 8 characters, show the right spelling with
  the differing letters highlighted) | 'wrong' (show the right answer + 🔊).

## Screens
- New bottom-nav tab "Học thuộc" (5 tabs total, keep labels short).
- Học thuộc home:
  - Big progress: "Đã thuộc X / Y cụm từ" + a bar per level (0–5).
  - Start buttons: "Luyện nhanh 10 câu" (all learned units), choose a unit, "Từ hay sai" (wrong ≥ 2 or starred),
    "Ghép cặp".
- Practice session (10 questions by default, setting 5–30):
  - Priority: lowest level first, then most wrong, then least recently practiced; mix exercise types.
  - Immediate feedback (green/red), 🔊 after every answer, a "Tiếp tục" button (Enter also works).
  - Combo counter for consecutive correct answers. Wrong items come back once at the end of the session.
  - Summary: correct %, phrases that levelled up, list of wrong phrases with "Luyện lại câu sai".
- Sổ tay từ vựng (vocabulary notebook) page linked from Học thuộc:
  - Search box (matches English or Vietnamese, accent-insensitive for Vietnamese).
  - Filters: Tất cả / Chưa thuộc / Đã thuộc / Đánh dấu ⭐.
  - Each row: emoji, English, Vietnamese, level dots, 🔊, ⭐ toggle. Tap a row to see example sentences
    from the book and the user's own sentences for that phrase.

## Integration with existing review
- Settings: "Cách ôn tập" = "Tự chấm" (current) or "Gõ đáp án".
  In "Gõ đáp án" mode ReviewSession shows an input instead of the reveal button: correct → grade 'good',
  near → 'hard', wrong → 'again' (SM-2 unchanged). Answers in review also update mastery.
- Home page: add a small "Đã thuộc X/Y" stat linking to Học thuộc.
- Unit list: show "đã thuộc" % from mastery level 5 (keep the existing step checkmarks).

## Quality
- Ignore double taps while an answer is saving (same pattern as ReviewSession `busy` ref).
- Input: autocapitalize off, autocorrect off, spellcheck off, lang="en", enterKeyHint="done".
- Accessible names on all buttons; feedback announced with aria-live.
- Respect prefers-reduced-motion for the shake/confetti effects.

## Done when
- npm test passes, including new tests for answer-check (one's, variants, (the), near/wrong) and for
  the level ladder + question picker; npm run build passes with no TypeScript errors.
- Upgrading from the current version keeps all existing progress, sentences and recordings.
- Export → wipe → import restores mastery too; importing an old backup (no mastery table) still works.
- On a 390px phone: each of the 7 exercise types can be completed; a 10-question session ends with a summary;
  the notebook search finds "báo thức" and "snooze".
- Update docs/huong-dan.md with a short "Học thuộc" section.
```
