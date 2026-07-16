---
phase: 2
title: "Content collections & bài mẫu"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Content collections & bài mẫu

## Overview
Định nghĩa schema bài viết type-safe, bật MDX, tính reading time, tạo 5 bài mẫu tiếng Việt (tái dùng nội dung wireframe).

## Requirements
- Functional: collection `posts` Zod-validated; frontmatter sai → build fail; reading time tự tính.
- Non-functional: schema tối thiểu theo YAGNI — chỉ field đang dùng thật.

## Architecture
- Content Layer API của Astro 6: `src/content.config.ts`, loader glob `src/content/posts/*.{md,mdx}`.
- Schema: `title` (string), `description` (string, dùng làm excerpt + meta description), `pubDate` (date), `updatedDate` (date optional), `tags` (string[], lowercase), `cover` (image optional + `coverAlt`), `draft` (boolean default false).
- Reading time: remark plugin custom (`src/lib/remark-reading-time.mjs`) ghi vào `frontmatter.minutesRead` — công thức ~200 từ/phút (tiếng Việt đơn âm tiết, giữ mặc định, không over-engineer).
- Draft: helper `getPublishedPosts()` trong `src/lib/posts.ts` — điểm lọc DUY NHẤT cho `draft: true`, dùng ở MỌI nơi đọc collection (getStaticPaths, listings, RSS, tag pages). Red-team: draft từng có thể lộ qua route → sitemap → Pagefind index vì chỉ lọc listing; helper tập trung chặn từ gốc (không build route = không vào sitemap/index).

## Related Code Files
- Create: `src/content.config.ts`
- Create: `src/lib/posts.ts` (`getPublishedPosts()`)
- Create: `src/lib/remark-reading-time.mjs`
- Create: `src/content/posts/hoc-cach-noi-khong.mdx`, `5-dieu-uoc-khi-moi-di-lam.md`, `ghi-chu-zettelkasten-mot-nam.mdx`, `di-ha-giang-mua-tam-giac-mach.md`, `tu-hoc-tieng-anh-tuoi-25.md` (nội dung từ wireframe, mỗi bài ≥600 từ, có h2/h3/blockquote; 1 bài MDX có code block)
- Modify: `astro.config.mjs` (thêm `@astrojs/mdx`, remark plugin)

## Implementation Steps
1. `npx astro add mdx`.
2. Viết `content.config.ts` với schema trên (`image()` helper cho cover).
3. Viết remark-reading-time (dùng `mdast-util-to-string` + tính từ).
4. Tạo 5 bài mẫu — filename kebab-case không dấu; nội dung tiếng Việt có dấu đầy đủ; tags trùng wireframe: `cuộc sống`, `sự nghiệp`, `kinh nghiệm`, `năng suất`, `học tập`, `du lịch`.
5. Verify type: `astro check`; thử frontmatter sai → build phải fail rồi revert.

## Success Criteria
- [ ] `getCollection('posts')` trả 5 bài, type đầy đủ
- [ ] `minutesRead` xuất hiện trong `render()` result
- [ ] Frontmatter thiếu `title` → build fail (đã test thử)
- [ ] 1 bài `draft: true` thử nghiệm không xuất hiện trong `getPublishedPosts()` (xóa bài thử sau khi verify)

## Risk Assessment
- Slug tiếng Việt: dùng filename không dấu làm slug (Astro mặc định) — tránh URL encode dấu. Không cần custom slugify.
