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
- GitHub Pages: đưa nội dung `dist/` lên nhánh hoặc thư mục mà Pages phục vụ.

Trang phải chạy qua HTTPS. Nếu không, app không cài được lên màn hình chính, không ghi âm được và không dùng được khi offline.

## Thêm bài mới

- Thêm ngay trong app: vào Cài đặt → Nhập dữ liệu bài mới, rồi dán JSON của một bài. Bài này chỉ có trên máy đó.
- Thêm cho mọi người dùng: tạo file `src/data/unit-XX.json` rồi tạo lại bản build.

JSON có cùng định dạng với `src/data/unit-01.json` và được kiểm tra bởi `src/lib/validate-unit.ts`.
Câu lệnh để chuyển ảnh trang sách thành JSON nằm ở Prompt 2 trong `plans/reports/vibe-prompt-261027-0104-english-phrase-app.md`.

## Lưu ý về dữ liệu

Xóa dữ liệu trình duyệt sẽ làm mất toàn bộ tiến độ. Hãy vào Cài đặt → Xuất sao lưu thường xuyên. App sẽ nhắc nếu đã hơn 7 ngày bạn chưa sao lưu.
