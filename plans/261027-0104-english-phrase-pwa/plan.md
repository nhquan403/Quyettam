---
status: completed
branch: claude/english-phrase-app
---
# PWA học cụm từ tiếng Anh

Nguồn yêu cầu: `plans/reports/vibe-prompt-261027-0104-english-phrase-app.md` (Prompt 1).
Thiết kế đã chốt: `plans/reports/brainstorm-261027-0054-english-phrase-app.md`.

## Kiến trúc
- Vite + React + TS + Tailwind v4, HashRouter (chạy được ở mọi đường dẫn tĩnh), `base: './'`.
- Dexie (IndexedDB): `cards` (SM-2), `progress` (bước bài học), `sentences`, `recordings` (Blob),
  `customUnits`, `meta` (cài đặt, mốc sao lưu, số thẻ mới/ngày), `studyDays` (chuỗi ngày học).
- Nội dung tĩnh: `src/data/unit-*.json` qua `import.meta.glob`, gộp với bài nhập tay (bài nhập ghi đè cùng id).
- Logic thuần có test: `srs.ts` (SM-2), `validate-unit.ts`, `dates.ts`, `backup.ts` (fake-indexeddb).

## Phases
1. Khung dự án, PWA, font, theme sáng/tối, điều hướng dưới. 
2. Lớp dữ liệu + logic thuần + test.
3. Màn hình: Trang chủ, Danh sách bài, Bài học 4 bước, Ôn tập, Kể chuyện cuối tuần, Cài đặt, Nhập bài.
4. Kiểm tra: `npm test`, `npm run build`, Playwright ở 390px (chụp màn hình, offline sau lần tải đầu).
5. Review code, commit, push.

## Acceptance criteria
Theo mục "Done when" của Prompt 1.

## Rủi ro
- iOS Safari: SpeechRecognition thiếu → ẩn nút; MediaRecorder dùng `audio/mp4`.
- Mất dữ liệu khi xóa dữ liệu trình duyệt → nhắc sao lưu sau 7 ngày.
