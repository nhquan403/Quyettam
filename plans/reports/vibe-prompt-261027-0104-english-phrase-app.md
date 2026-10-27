# Prompt để vibe code web app học cụm từ tiếng Anh

Dùng với: Claude Code, Cursor, Lovable, Bolt, v0… Dán nguyên Prompt 1 để tạo app.
Khi có ảnh trang sách mới, dùng Prompt 2 với ChatGPT/Claude (có xem ảnh) để lấy dữ liệu JSON, rồi dán vào app.

---

## Prompt 1 — Tạo app

```text
Build a mobile-first Progressive Web App for learning English phrases from a Vietnamese phrase book
("Top 1500+ cụm từ tiếng Anh thông dụng theo chủ đề"). The learner is Vietnamese.
ALL UI TEXT MUST BE IN VIETNAMESE. English appears only in the learning content.

## Tech
- Vite + React + TypeScript + Tailwind CSS. No backend, no login, no paid API.
- PWA (vite-plugin-pwa): installable to the phone home screen, works offline after first load.
- Store all user data in IndexedDB (use Dexie or idb-keyval). Audio recordings stored as Blobs.
- Phrase content lives in static JSON files under src/data/ (one file per unit), loaded at build time.
- Text-to-speech: browser Web Speech API (speechSynthesis), lang "en-US", with normal (rate 1) and slow (rate 0.7) buttons, and a settings option to pick the English voice.
- Recording: MediaRecorder API. Speech recognition (webkitSpeechRecognition) is OPTIONAL: show it only when the browser supports it.
- Deployable as a static site (relative base path so it works on GitHub Pages or Cloudflare Pages).

## Data model (src/data/unit-01.json etc.)
type Phrase = { id: string; en: string; variants?: string[]; vi: string; emoji: string; situation: string };
type Sentence = { en: string; vi: string; phraseIds: string[] };
type Unit = { id: string; chapter: number; chapterTitle: string; unit: number; title: string; phrases: Phrase[]; sentences: Sentence[] };
"variants" are alternatives shown in [brackets] in the book, e.g. "goes off [rings]".
"situation" is a short Vietnamese scenario used as the flashcard prompt.

## Learning flow (one unit = one lesson, 4 steps shown as a stepper)
1. HỌC (Learn): card shows emoji + Vietnamese situation + Vietnamese meaning. English is hidden.
   User thinks/says the answer, taps "Lật thẻ" to reveal the English phrase + variants.
   Buttons: 🔊 nghe, 🐢 nghe chậm, and a counter "Đọc to 3 lần" (tap 3 times to mark done).
   After the cards, list the unit's example sentences (EN + VI) with 🔊 on each.
2. TỰ VIẾT CÂU (Personalize): for each phrase, the user writes their own sentences about their real life.
   Show rotating hints: "Quá khứ", "Phủ định", "Câu hỏi", "Thói quen (always/usually/never)".
   Remind: "one's → my/his/her…", and conjugate verbs (goes off → went off).
   Save sentences per phrase; editable and deletable; 🔊 to hear your own sentence.
3. NÓI (Speak): a 1-minute recorder with countdown. Prompt: "Kể về buổi sáng của bạn, dùng các cụm từ của bài này" and show the unit's phrases as chips to tick off while speaking.
   Save recordings with date; play back; delete.
   Button "Sao chép câu lệnh luyện với AI" copies a ready-made prompt for ChatGPT/Claude voice mode, e.g.:
   "You are my friendly English conversation partner. Ask me simple questions about my morning so I can use these phrases: <phrase list>. Use easy English, one question at a time. After each of my answers, correct my mistakes briefly, then ask the next question."
4. ÔN TẬP (Review): spaced repetition with SM-2. Front = emoji + Vietnamese situation. User says the English out loud, taps to reveal, then grades: "Quên" / "Khó" / "Nhớ" / "Dễ".
   Phrases enter review only after the user finishes step 1 of their unit.

## Screens
- Trang chủ: today's summary (số thẻ cần ôn hôm nay, streak ngày học liên tiếp, nút "Ôn ngay"), "Học tiếp" button to the next unfinished lesson.
- Danh sách bài: grouped by chapter, each unit shows progress (4 steps checkmarks + % phrases mastered).
- Bài học: the 4-step flow above.
- Ôn tập: daily due cards across all units, with a daily new-card limit (default 15, configurable).
- Kể chuyện cuối tuần: a weekly page where the user records a 2-minute story combining that week's units; keeps all past recordings listed by week so they can compare progress over time.
- Cài đặt: chọn giọng đọc, tốc độ, số thẻ mới/ngày, "Xuất sao lưu" (download one JSON file with progress, sentences and recordings as base64), "Nhập sao lưu" (restore from that file, with confirmation), "Xóa toàn bộ dữ liệu" (with confirmation).
- Nhập dữ liệu bài mới: a page where the user pastes Unit JSON (same schema) to add/replace a unit; validate and show readable Vietnamese errors. Imported units are stored in IndexedDB and merged with the built-in ones.

## UX rules
- Designed for a phone held in one hand: large tap targets (min 44px), bottom navigation (Trang chủ, Bài học, Ôn tập, Cài đặt).
- Clean, calm look, light and dark mode following the system.
- Swipe or tap to flip cards. Smooth but short animations.
- Never lose user data silently; confirm destructive actions.
- Show a gentle banner reminding to "Xuất sao lưu" if the last backup is older than 7 days.

## Seed data
Create src/data/unit-01.json with exactly this content:

{
  "id": "c1-u01", "chapter": 1, "chapterTitle": "After getting up", "unit": 1, "title": "Thức dậy",
  "phrases": [
    {"id":"alarm-goes-off","en":"the alarm clock goes off","variants":["the alarm clock rings"],"vi":"đồng hồ báo thức đổ chuông (kêu)","emoji":"⏰","situation":"6 giờ sáng, cái đồng hồ bên giường bắt đầu reo inh ỏi"},
    {"id":"turn-over-in-bed","en":"turn over in bed","variants":["roll over in bed"],"vi":"lăn lộn trên giường","emoji":"🛌","situation":"Bạn chưa muốn dậy nên cứ trở mình qua lại trên giường"},
    {"id":"hit-snooze","en":"hit the snooze button","vi":"nhấn nút \"báo lại\"","emoji":"😴","situation":"Báo thức kêu nhưng bạn muốn ngủ thêm 5 phút nữa"},
    {"id":"turn-off-alarm","en":"turn off the alarm clock","vi":"tắt chuông báo thức","emoji":"🔕","situation":"Bạn bấm cho đồng hồ báo thức im hẳn"},
    {"id":"turn-on-radio","en":"turn on the radio","vi":"bật ra-đi-ô","emoji":"📻","situation":"Bạn muốn nghe nhạc buổi sáng từ cái đài"},
    {"id":"wake-up-at","en":"wake up at 6 a.m.","vi":"thức dậy lúc 6 giờ sáng","emoji":"🕕","situation":"Nói giờ bạn mở mắt mỗi sáng"},
    {"id":"half-asleep","en":"be half asleep","vi":"ngái ngủ","emoji":"🥱","situation":"Đã dậy rồi nhưng mắt vẫn díp lại, đầu óc chưa tỉnh"},
    {"id":"get-up-early","en":"get up in the early morning","vi":"dậy sớm","emoji":"🌅","situation":"Trời còn tối bạn đã rời giường"},
    {"id":"get-up-late-weekends","en":"get up late on (the) weekends","vi":"dậy muộn vào cuối tuần","emoji":"🗓️","situation":"Thứ Bảy, 11 giờ trưa bạn mới dậy"},
    {"id":"all-nighter","en":"stay up all night","variants":["pull an all-nighter"],"vi":"thức thâu đêm, thức trắng đêm","emoji":"🌙","situation":"Bạn uống nước tăng lực và không ngủ từ 9 giờ tối đến 6 giờ sáng"},
    {"id":"oversleep","en":"oversleep","vi":"ngủ quên","emoji":"😱","situation":"Bạn mở mắt ra thì đã quá giờ đi học"},
    {"id":"sleep-in","en":"sleep in","vi":"ngủ nướng","emoji":"🛏️","situation":"Không phải đi làm nên bạn cố ý ngủ thêm cho đã"},
    {"id":"sit-up-stretch","en":"sit up in bed and stretch","vi":"ngồi trên giường và vươn vai","emoji":"🙆","situation":"Bạn ngồi dậy và giơ hai tay lên cho giãn người"},
    {"id":"put-glasses-on","en":"put one's glasses on","vi":"đeo kính","emoji":"👓","situation":"Bạn cần nhìn rõ nên với lấy cặp kính"},
    {"id":"get-out-of-bed","en":"get out of bed","vi":"ra khỏi giường, rời giường","emoji":"🚶","situation":"Bạn đặt chân xuống sàn và đứng dậy khỏi giường"},
    {"id":"make-bed","en":"make one's bed","vi":"dọn giường","emoji":"🧹","situation":"Bạn kéo chăn cho phẳng, xếp gối gọn gàng"},
    {"id":"fold-bedding","en":"fold up the bedding","vi":"gấp chăn đệm","emoji":"🧺","situation":"Bạn gấp chăn thành từng lớp xếp gọn một góc"},
    {"id":"turn-on-light","en":"turn on the light","vi":"bật đèn","emoji":"💡","situation":"Phòng tối quá, bạn bấm công tắc"},
    {"id":"open-window","en":"open the window","vi":"mở cửa sổ","emoji":"🪟","situation":"Bạn muốn không khí trong lành vào phòng"},
    {"id":"look-outside","en":"look outside","vi":"nhìn ra bên ngoài","emoji":"👀","situation":"Bạn đứng ở cửa sổ xem trời mưa hay nắng"},
    {"id":"check-email","en":"check one's email","vi":"kiểm tra email","emoji":"📧","situation":"Bạn mở hộp thư xem có thư công việc mới không"},
    {"id":"check-texts","en":"check text messages on one's mobile phone","vi":"kiểm tra tin nhắn điện thoại","emoji":"📱","situation":"Bạn cầm điện thoại xem ai đã nhắn cho mình"},
    {"id":"put-on-robe","en":"put on a shower robe","vi":"mặc áo choàng tắm","emoji":"🥋","situation":"Vừa tắm xong, bạn khoác áo choàng cho khỏi nhỏ nước"},
    {"id":"put-on-sportswear","en":"put on one's sportswear","variants":["put on one's jogging suit"],"vi":"mặc đồ thể thao (đồ chạy bộ)","emoji":"🏃","situation":"Bạn chuẩn bị đi chạy bộ buổi sáng"},
    {"id":"leave-room","en":"get out of one's room","variants":["leave one's room"],"vi":"ra khỏi (rời) phòng","emoji":"🚪","situation":"Bạn mở cửa bước ra khỏi phòng ngủ"},
    {"id":"check-news","en":"turn on the news","variants":["check the news"],"vi":"bật kênh thời sự / kiểm tra tin tức","emoji":"📺","situation":"Bạn muốn biết hôm nay có tin gì mới"}
  ],
  "sentences": [
    {"en":"He turned over in bed as the alarm went off in the early morning.","vi":"Anh ấy lăn lộn trên giường khi báo thức kêu vào sáng sớm.","phraseIds":["turn-over-in-bed","alarm-goes-off"]},
    {"en":"I usually wake up at 7 a.m. for work, but I sleep in on the weekends.","vi":"Tôi thường dậy lúc 7 giờ sáng để đi làm, nhưng tôi ngủ nướng vào cuối tuần.","phraseIds":["wake-up-at","sleep-in"]},
    {"en":"She was half asleep throughout the whole class.","vi":"Cô ấy ngái ngủ trong suốt giờ học.","phraseIds":["half-asleep"]},
    {"en":"I pulled an all-nighter to prepare for the quiz today.","vi":"Tôi đã thức thâu đêm để chuẩn bị cho bài kiểm tra hôm nay.","phraseIds":["all-nighter"]},
    {"en":"I overslept today and I am late for school.","vi":"Hôm nay tôi ngủ quên và đi học muộn.","phraseIds":["oversleep"]},
    {"en":"Sitting up in bed and stretching is a good way to start the day.","vi":"Ngồi trên giường và vươn vai là cách tốt để bắt đầu ngày mới.","phraseIds":["sit-up-stretch"]},
    {"en":"I always make my bed before I leave my room.","vi":"Tôi luôn dọn giường trước khi rời khỏi phòng.","phraseIds":["make-bed","leave-room"]},
    {"en":"We don't open the windows in mornings during the winter.","vi":"Vào mùa đông, chúng tôi không mở cửa sổ vào buổi sáng.","phraseIds":["open-window"]},
    {"en":"I have a habit of checking my business email in the morning.","vi":"Tôi có thói quen kiểm tra email công việc vào buổi sáng.","phraseIds":["check-email"]},
    {"en":"Please put on a shower robe. You are dripping all over the floor.","vi":"Mặc áo choàng tắm vào đi. Con đang làm nước vung vãi khắp sàn đấy.","phraseIds":["put-on-robe"]}
  ]
}

## Done when
- npm run build passes with no TypeScript errors.
- On a phone, the app installs to the home screen and works offline.
- Unit 01 shows all 26 phrases and 10 sentences; 🔊 plays each one.
- My sentences and recordings survive a page reload.
- Review shows due cards correctly; export then import restores everything.
- Pasting a new unit JSON on the import page adds a new lesson.
```

---

## Prompt 2 — Chuyển ảnh trang sách thành dữ liệu (dùng với ChatGPT/Claude, đính kèm ảnh)

```text
These are photos of pages from a Vietnamese English-phrase book. Transcribe them into ONE JSON object
with this exact schema, and output only the JSON:

{ "id": "c<chapter>-u<unit 2 digits>", "chapter": number, "chapterTitle": string (English, from page footer),
  "unit": number, "title": string (Vietnamese unit title),
  "phrases": [ { "id": kebab-case English slug, "en": main phrase, "variants": [alternatives shown in [brackets], written as full phrases] (omit if none),
                 "vi": Vietnamese meaning exactly as printed, "emoji": one fitting emoji,
                 "situation": a short, concrete Vietnamese scenario (do NOT reveal the English) } ],
  "sentences": [ { "en": ..., "vi": ..., "phraseIds": [ids of phrases used] } ] }

Rules: copy English and Vietnamese text exactly as printed (fix only obvious OCR errors);
include every phrase and every example sentence on the pages; if text is unreadable, write "??" instead of guessing.
```
