---
phase: 3
title: "Pages, SEO, RSS, sitemap"
status: completed
priority: P1
dependencies: [2]
---

# Phase 3: Pages, SEO, RSS, sitemap

## Overview
Dựng đủ 5 loại trang theo wireframe (home, bài viết, tags, about, 404) + SEO/OG + RSS + sitemap + robots.txt.

## Requirements
- Functional: mọi trang khớp wireframe tương ứng (light/dark/mobile); prev/next theo pubDate; tag page lọc đúng.
- Non-functional: HTML semantic (`header/nav/main/article/footer`, `<time>`, 1 h1/trang); URL: `/bai-viet/{slug}/`, `/chu-de/`, `/chu-de/{tag}/`, `/gioi-thieu/`.

## Architecture
- `post-card.astro` dùng chung cho home + tag page (DRY).
- SEO: component `seo-meta.astro` trong BaseLayout — title template `{page} — Chính.`, description, canonical, OG (og:title/description/type/image mặc định), `<html lang="vi">`.
- Đọc bài: MỌI nơi (home, `getStaticPaths`, tag pages, RSS) qua `getPublishedPosts()` từ phase 2 — không gọi `getCollection('posts')` trực tiếp. Draft không có route → không vào sitemap/Pagefind (red-team).
- RSS: `src/pages/rss.xml.js` với `@astrojs/rss` (full description — đầu vào cho Buttondown RSS-to-email phase 5).
- URL gốc — 1 NGUỒN DUY NHẤT (red-team: `site` trong astro.config + `url` trong config.ts là 2 nguồn sẽ drift): tạo `src/config.ts` export `siteUrl` (placeholder `https://example.com` + TODO chốt domain ở onboarding); `astro.config.mjs` import `siteUrl` làm `site`; mọi nơi khác dùng `Astro.site` / `import.meta.env.SITE` — KHÔNG hardcode URL thứ hai. Khi `siteUrl` còn placeholder → `astro.config.mjs` in cảnh báo rõ lúc build (console.warn).
- Sitemap: `@astrojs/sitemap` (dùng `site` ở trên).
- Tag slug: map tag có dấu → slug không dấu (vd `cuộc sống` → `cuoc-song`) qua helper `src/lib/slugify.ts` (dùng cho cả route lẫn link).

## Related Code Files
- Create: `src/pages/index.astro` (thay placeholder), `src/pages/bai-viet/[slug].astro`, `src/pages/chu-de/index.astro`, `src/pages/chu-de/[tag].astro`, `src/pages/gioi-thieu.astro`, `src/pages/404.astro`, `src/pages/rss.xml.js`, `public/robots.txt`
- Create: `src/components/post-card.astro`, `src/components/seo-meta.astro`, `src/components/post-nav.astro` (prev/next), `src/components/newsletter-form.astro` (markup tĩnh, action nối phase 5), `src/lib/slugify.ts`, `src/config.ts` (`siteUrl` — phase 5 mở rộng thêm giscus/buttondown)
- Modify: `astro.config.mjs` (`site` + sitemap integration), `src/layouts/base-layout.astro` (nhận props SEO)

## Implementation Steps
1. Port CSS prose bài viết từ `docs/wireframe/post.html`: blockquote, code block, inline code, figure/caption, hr "···", byline muted — vào global.css theo tokens.
2. Home: masthead + list 5 post-card (sort pubDate desc) + newsletter section.
3. `[slug].astro`: `getStaticPaths` từ `getPublishedPosts()`; render MDX; byline (tác giả · ngày "15 tháng 6, 2026" · X phút đọc); tag list; prev/next; chỗ đặt Giscus (phase 5).
4. Tag pages: index đếm bài/tag (pill to theo guidelines); trang tag lọc + reuse post-card.
5. About + 404 port từ wireframe (404 đơn giản: thông báo + link về home).
6. SEO component + rss.xml + sitemap + robots.txt (`Sitemap:` line).
7. So khớp visual với `docs/wireframes/*.png` (screenshot lại bằng headless Chrome nếu cần).

## Success Criteria
- [ ] Build sinh đủ route: `/`, `/bai-viet/{5 slug}/`, `/chu-de/`, `/chu-de/{6 tag}/`, `/gioi-thieu/`, `/404.html`, `/rss.xml`, `/sitemap-index.xml`
- [ ] RSS valid — check bằng `xmllint --noout dist/rss.xml` (sẵn trên macOS; package `@w3c/xml-validator` KHÔNG tồn tại trên npm — red-team verify E404); item có full description, không chứa draft
- [ ] Canonical/og:url/RSS link/sitemap đều derive từ `Astro.site` — grep `example.com` trong `src/` chỉ ra đúng 1 chỗ (`src/config.ts`)
- [ ] Visual khớp wireframe 3 viewport chính (1280 light/dark, 375)

## Risk Assessment
- OG image: chưa có ảnh thương hiệu → dùng 1 ảnh OG tĩnh mặc định generate đơn giản (nền token + tên blog) đặt `public/og-default.png`; og:image per-post lấy `cover` nếu có. Không làm satori/dynamic OG (YAGNI).
