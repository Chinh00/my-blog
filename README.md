# Chính. — Blog cá nhân

Blog tĩnh tiếng Việt dựng bằng [Astro 6](https://astro.build): chia sẻ kinh nghiệm, kiến thức và những lát cắt cuộc sống. Giao diện Warm Serif (Lora + Be Vietnam Pro), dark mode, tìm kiếm Pagefind, bình luận Giscus, newsletter Buttondown.

## Chạy dự án

```bash
npm install
npm run dev       # dev server — http://localhost:4321
npm run build     # build tĩnh vào dist/ (kèm index tìm kiếm Pagefind)
npm run preview   # xem bản build (tìm kiếm chỉ hoạt động ở đây, không phải dev)
```

## Viết bài mới

Tạo file `.md` hoặc `.mdx` trong `src/content/posts/` — tên file không dấu, kebab-case (thành slug URL `/bai-viet/{ten-file}/`):

```markdown
---
title: "Tiêu đề bài viết"
description: "Mô tả ngắn — dùng làm excerpt ở trang chủ + meta description."
pubDate: 2026-08-01
tags: ["cuộc sống", "kinh nghiệm"]
draft: true # bài nháp: không build route, không vào RSS/sitemap/tìm kiếm
---

Nội dung markdown…
```

Bỏ `draft: true` (hoặc đặt `false`) khi muốn xuất bản. Thời gian đọc tự tính (~200 từ/phút).

## Cấu hình trước khi deploy (3 việc, đều trong `src/config.ts`)

1. **Domain** — đổi `siteUrl` từ `https://example.com` thành domain thật.
   Khi còn placeholder, mỗi lần build sẽ in cảnh báo; canonical/OG/RSS/sitemap đều lấy từ giá trị này.
2. **Giscus (bình luận)** — cần repo GitHub public đã bật Discussions:
   vào [giscus.app](https://giscus.app), chọn repo + category, copy `repo`, `repoId`, `category`, `categoryId` vào `giscus` trong config. Để `null` → hiện khung "Bình luận sẽ sớm có". (repoId/categoryId không phải secret.)
3. **Buttondown (newsletter)** — điền `buttondownUsername` để form đăng ký hoạt động.
   Gửi bài qua email: trên dashboard Buttondown bật **RSS-to-email** trỏ vào `https://{domain}/rss.xml` (feed chứa full nội dung bài). Sau khi bật, gửi thử 1 email và kiểm tra ký tự tiếng Việt hiển thị đúng.

## Deploy

Output tĩnh thuần (`dist/`), không adapter — deploy được lên Vercel / Cloudflare Pages / GitHub Pages. Build command `npm run build`, output directory `dist`.

## Cấu trúc chính

- `src/content/posts/` — bài viết (nguồn nội dung duy nhất)
- `src/config.ts` — cấu hình trung tâm (domain, Giscus, Buttondown)
- `src/styles/global.css` — design tokens + toàn bộ CSS (nguồn: `docs/design-guidelines.md`)
- `src/components/effects/` — hiệu ứng React islands (Magic UI + motion)
- `docs/` — tech stack, design guidelines, wireframes đã duyệt
