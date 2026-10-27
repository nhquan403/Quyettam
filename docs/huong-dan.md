# Hướng dẫn: app Học Cụm Từ Tiếng Anh

Web app (PWA) để học cuốn "Top 1500+ cụm từ tiếng Anh thông dụng theo chủ đề" trên điện thoại.
App không có máy chủ. Mọi dữ liệu (tiến độ, câu tự viết, bản ghi âm) đều lưu trong IndexedDB của trình duyệt.

## Chạy trên máy

```bash
npm install
npm run dev      # mở http://localhost:5173
npm test         # test logic ôn tập, sao lưu và kiểm tra dữ liệu bài
npm run build    # tạo thư mục dist/ để đưa lên mạng
```

## Đưa lên mạng

Thư mục `dist/` là web tĩnh dùng đường dẫn tương đối, nên đặt ở thư mục nào cũng chạy được.

- Cloudflare Pages: lệnh tạo bản là `npm run build`, thư mục xuất là `dist`.
- GitHub Pages (đang dùng): app chạy ở https://nhquan403.github.io/Quyettam/. Pages phục vụ nhánh `gh-pages`, nhánh này chỉ chứa bản build. Để cập nhật:

  ```bash
  npm run build
  cd dist && touch .nojekyll && git init -b gh-pages && git add -A && git commit -m "deploy"
  git push -f https://github.com/nhquan403/Quyettam.git gh-pages
  ```

  Sau khi đẩy lên khoảng 1 phút thì trang được cập nhật. App đã cài trên điện thoại sẽ tự lấy bản mới ở lần mở kế tiếp.

Trang phải chạy qua HTTPS. Nếu không, app không cài được lên màn hình chính, không ghi âm được và không dùng được khi offline.

## Thêm bài mới

- Thêm ngay trong app: vào Cài đặt → Nhập dữ liệu bài mới, rồi dán JSON của một bài. Bài này chỉ có trên máy đó.
- Thêm cho mọi người dùng: tạo file `src/data/unit-XX.json` rồi tạo lại bản build.

JSON có cùng định dạng với `src/data/unit-01.json` và được kiểm tra bởi `src/lib/validate-unit.ts`.
Câu lệnh để chuyển ảnh trang sách thành JSON nằm ở Prompt 2 trong `plans/reports/vibe-prompt-261027-0104-english-phrase-app.md`.

## Học thuộc

Tab "Học thuộc" có các bài tập tự nhớ lại cho những cụm từ thuộc bài đã xong bước Học.

- **Bậc thuộc:** mỗi cụm từ có bậc từ 0 đến 5. Trả lời đúng thì lên 1 bậc, sai thì xuống 1 bậc, gần đúng (sai chính tả nhẹ) thì giữ nguyên. Bậc 5 là "Đã thuộc".
- **Bài tập theo bậc:**
  - Bậc 0–1: trắc nghiệm hoặc nghe chọn nghĩa.
  - Bậc 2–3: xếp từ hoặc điền chỗ trống. Cụm từ ngắn dưới 3 từ thì luôn là điền chỗ trống.
  - Bậc 4–5: gõ cả cụm hoặc nghe chép chính tả.
  - Nếu trình duyệt không đọc được tiếng Anh, bài nghe được thay bằng bài đọc tương ứng. Nút "Không nghe được" cho phép bỏ qua mà không bị trừ bậc.
- **Ghép cặp** chỉ là trò chơi nhận diện, không làm thay đổi bậc.
- **Sổ tay từ vựng:** tìm được cả khi gõ không dấu, lọc theo trạng thái và đánh dấu ⭐. Cụm từ đã đánh dấu ⭐ hoặc sai từ 2 lần trở lên sẽ vào mục "Từ hay sai".
- **Cài đặt:** chọn cách ôn tập là "Tự chấm" hoặc "Gõ đáp án", và chọn số câu mỗi phiên luyện (5–30). Ở chế độ "Gõ đáp án", đáp án gõ vào cũng được tính vào bậc thuộc.
- **Tiến độ trong Danh sách bài** giờ tính theo "đã thuộc" (bậc 5) chứ không theo số thẻ đã nhớ như trước.
- **Logic ở đâu:** `src/lib/answer-check.ts` (chấm đáp án), `src/lib/questions.ts` (chọn và tạo câu hỏi), `src/lib/mastery.ts` (bậc thuộc).

Sao lưu đã bao gồm bậc thuộc. File sao lưu tạo từ bản cũ vẫn nhập được; khi đó bậc thuộc bắt đầu lại từ 0.

## Lưu ý về dữ liệu

Xóa dữ liệu trình duyệt sẽ làm mất toàn bộ tiến độ. Hãy vào Cài đặt → Xuất sao lưu thường xuyên. App sẽ nhắc nếu đã hơn 7 ngày bạn chưa sao lưu.
