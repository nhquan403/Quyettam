# Web app học cụm từ tiếng Anh — Brainstorm contract

Ngày: 2026-10-27 · Trạng thái: đã chốt, chờ dữ liệu ảnh rồi lập plan

## Outcome
Web app chạy trên điện thoại (cài được lên màn hình chính như app) giúp học sách
"Top 1500+ cụm từ tiếng Anh thông dụng theo chủ đề" theo vòng 4 bước:
Học (nghe phát âm) → Tự viết câu về mình → Nói/ghi âm → Ôn thẻ lặp lại ngắt quãng.

## Quyết định của người dùng
- Thiết bị chính: điện thoại (mobile-first).
- Lưu dữ liệu: trên máy (IndexedDB/localStorage), có xuất/nhập file sao lưu. Không tài khoản.
- Luyện với AI: không tích hợp; app tạo sẵn câu lệnh theo bài để sao chép sang ChatGPT/Claude.
- Hình ảnh: emoji + tình huống tiếng Việt làm mặt trước thẻ; không cắt ảnh từ sách.

## Constraints
- Web tĩnh, miễn phí: Vite + TypeScript, PWA, triển khai GitHub Pages.
- Phát âm bằng Web Speech API (speechSynthesis) có sẵn trong trình duyệt; không cần khóa API.
- Ghi âm bằng MediaRecorder; nhận dạng giọng nói chỉ là tính năng phụ (iOS Safari hỗ trợ hạn chế).
- Dữ liệu cụm từ do Claude chép từ ảnh người dùng gửi vào file JSON; người dùng soát lại.
- Không đưa nguyên văn ảnh sách lên repo công khai (bản quyền); repo nên để private.

## Non-goals
- Đăng nhập, đồng bộ nhiều máy, máy chủ.
- Chat AI trong app.
- Cắt hình minh họa, OCR tự động trong app.
- Nhập toàn bộ 1500 cụm từ ngay đợt đầu — nhập dần theo ảnh gửi.

## Mô hình dữ liệu (đề xuất)
Mỗi cụm từ: id, chapter, unit, unitTitle, phrase (en), variants (vd "rings" cho "goes off"),
vi, emoji, situation (tình huống tiếng Việt), examples [{en, vi}] từ "Sentences to use".

## Màn hình
1. Danh sách chương/bài + tiến độ.
2. Học bài: thẻ che tiếng Anh → đoán → lật, nút nghe (tốc độ thường/chậm), đọc to 3 lần.
3. Tự viết câu: gợi ý dạng (quá khứ, phủ định, câu hỏi, thói quen), lưu câu của mình.
4. Nói: ghi âm 1 phút kể chuyện với các cụm từ của bài, nghe lại; nút sao chép câu lệnh AI.
5. Ôn tập: thẻ đến hạn hằng ngày (thuật toán SM-2 đơn giản), tự chấm Quên/Khó/Nhớ/Dễ.
6. Chủ nhật: kể chuyện cả tuần, lưu bản ghi để so sánh tiến bộ.
7. Cài đặt: xuất/nhập sao lưu, giọng đọc, số thẻ mới mỗi ngày.

## Trade-offs
- Web tĩnh lưu trên máy (chọn): rẻ, đơn giản; rủi ro mất dữ liệu nếu xóa dữ liệu trình duyệt → giảm bằng nút sao lưu file.
- Có backend: đồng bộ được nhưng tốn công/chi phí; chỉ đáng khi cần học trên nhiều máy.
- Xuất bộ thẻ Anki thay vì làm app: ôn tập tốt sẵn có, nhưng không có bước tự viết câu/ghi âm theo bài — vì vậy làm app, có thể thêm nút xuất Anki sau.

Better approaches: none — web app tĩnh là hướng người dùng yêu cầu và phù hợp nhất với các quyết định trên.

## Acceptance criteria
- Mở trên điện thoại, cài được lên màn hình chính, chạy được khi offline sau lần đầu.
- Unit 01 (trang 14–17) đầy đủ cụm từ và câu ví dụ đúng như sách.
- Bấm nghe được phát âm từng cụm từ và câu ví dụ.
- Lưu được câu tự viết và bản ghi âm; tải lại trang vẫn còn.
- Ôn tập hiển thị đúng thẻ đến hạn; xuất rồi nhập file sao lưu khôi phục đủ tiến độ.

## Bước tiếp theo
1. Người dùng gửi ảnh các trang (chụp thẳng, rõ chữ).
2. Lập plan → triển khai (ak:plan → ak:cook).

## Câu hỏi còn mở
- Repo GitHub public hay private (liên quan triển khai GitHub Pages và nội dung sách)?
