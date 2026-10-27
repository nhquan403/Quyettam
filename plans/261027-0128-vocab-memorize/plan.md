---
status: completed
branch: claude/english-phrase-app
---
# Tính năng Học thuộc

Nguồn yêu cầu: `plans/reports/vibe-prompt-261027-0128-vocab-memorize.md`.

## Thiết kế
- Dexie v2 thêm bảng `mastery` (key, unitId, level); v1 giữ nguyên nên dữ liệu cũ còn đủ. `TABLES` thêm `mastery`;
  import sao lưu cũ thiếu bảng này vẫn chạy vì bảng thiếu được coi là rỗng.
- Logic thuần có test: `answer-check.ts` (chuẩn hoá, one's, (the), variants, Levenshtein, diff),
  `mastery.ts` (thang 0–5, chọn câu hỏi, sinh câu hỏi 6 dạng, điền chỗ trống, xáo từ).
- Màn hình: tab "Học thuộc" (trang chính, phiên luyện, ghép cặp, sổ tay), chế độ ôn tập "Gõ đáp án",
  chỉ số "Đã thuộc" ở Trang chủ và Danh sách bài.
- Ghép cặp là trò chơi nhận diện nên không đổi bậc thuộc.

## Phases
1. Lớp dữ liệu + logic thuần + test (gồm test nâng cấp v1 → v2 và sao lưu cũ).
2. Màn hình và tích hợp ôn tập.
3. Kiểm tra: test, build, Playwright 390px cho đủ 7 dạng bài, phiên 10 câu, tìm kiếm sổ tay.
4. Review code, sửa, docs, commit, push.

## Acceptance criteria
Theo mục "Done when" của prompt nguồn.
