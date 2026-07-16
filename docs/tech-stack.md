# Tech Stack — my-blog

Chốt ngày 2026-07-15 (bootstrap --full, user đã duyệt).

## Core

| Thành phần | Lựa chọn | Ghi chú |
|---|---|---|
| Framework | Astro 6.x | Static output, zero-JS mặc định cho nội dung |
| Nội dung | Markdown/MDX trong repo | Content collections (Zod-validated), thư mục `src/content/` |
| Ngôn ngữ nội dung | Tiếng Việt (không i18n) | line-height 1.55–1.6, letter-spacing +0.2–0.5px cho dấu |
| Styling | CSS design tokens theo `docs/design-guidelines.md` + Tailwind CSS | Direction: Warm Serif (Lora + Be Vietnam Pro). Tailwind phục vụ component 21st.dev |
| Hiệu ứng | Component 21st.dev qua React islands (`@astrojs/react`) | User chốt: 4 nhóm — text reveal/shimmer, scroll reveal, hover (underline sweep, border beam), aurora + progress bar + View Transitions. Islands cài qua shadcn registry (nguồn gốc `magicui.design`, dep `motion`); progress bar = vanilla JS, View Transitions = native `@view-transition` (chốt sau red-team 2026-07-16). Tôn trọng `prefers-reduced-motion` |

## Tính năng & tích hợp

| Tính năng | Cách tích hợp |
|---|---|
| Dark mode | CSS class trên `<html>` + localStorage, sync theme OS |
| Bình luận | Giscus (GitHub Discussions) — script embed |
| Tìm kiếm | Pagefind qua `astro-pagefind` |
| Newsletter | Buttondown: RSS-to-email + form đăng ký embed |
| Tags | Content collection schema + dynamic routes |
| RSS | `@astrojs/rss` |
| SEO/OG/Sitemap | Meta component + `@astrojs/sitemap` |

## Deploy

Chưa chốt host. Output static thuần → portable Vercel / Cloudflare Pages / GitHub Pages, không cần adapter.

## Nguồn

- `plans/reports/researcher-260715-2223-tech-stack-static-blog-report.md`
- `plans/reports/researcher-260715-2223-blog-design-trends-report.md`

## Câu hỏi chưa chốt

- Buttondown ingest ký tự tiếng Việt qua RSS-to-email — verify khi setup.
- Host deploy cụ thể — chốt ở phase onboarding.
