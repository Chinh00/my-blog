---
title: "Xây blog cá nhân tiếng Việt — Astro 6 + Warm Serif + hiệu ứng 21st.dev"
status: completed
created: 2026-07-16
completed: 2026-07-16
mode: hard
blockedBy: []
blocks: []
---

# Plan: Astro Blog Build

Blog cá nhân tiếng Việt (kinh nghiệm, kiến thức, trải nghiệm, cuộc sống). Mọi quyết định scope/stack/design đã được user duyệt qua bootstrap gates — KHÔNG mở lại.

## Nguồn chân lý

- Stack: `docs/tech-stack.md` (Astro 6, MDX content collections, React islands cho hiệu ứng)
- Design: `docs/design-guidelines.md` (tokens, components, Motion §7) + `docs/wireframe/*.html` (markup/CSS tham chiếu — port sang Astro)
- Research: `plans/reports/researcher-260715-2223-tech-stack-static-blog-report.md`, `researcher-260715-2223-blog-design-trends-report.md`, `researcher-260716-0832-astro-react-islands-21st-dev-report.md`

## Phases

| # | Phase | File | Phụ thuộc |
|---|-------|------|-----------|
| 1 | Scaffold & nền design | `phase-01-scaffold-foundation.md` | — |
| 2 | Content collections & bài mẫu | `phase-02-content-collections.md` | 1 |
| 3 | Pages, SEO, RSS, sitemap | `phase-03-pages-seo-rss.md` | 2 |
| 4 | Hiệu ứng: React islands + CSS motion | `phase-04-effects-islands.md` | 3 |
| 5 | Search, Giscus, newsletter | `phase-05-search-comments-newsletter.md` | 3 |
| 6 | QA, a11y, polish | `phase-06-qa-polish.md` | 4, 5 |

Phase 4 và 5 độc lập nhau (có thể làm song song), cùng phụ thuộc phase 3.

## Acceptance criteria (toàn plan)

- [x] `npm run build` pass (15 pages, static thuần, không adapter), `astro check` 0 lỗi 0 warning
- [x] Giao diện khớp wireframe (screenshots light + dark + 375px, 2026-07-16), font Google subset vietnamese nạp async (Lighthouse fix)
- [x] Đủ tính năng: dark mode (toggle + localStorage + FOUC-free), tags (6 trang slug không dấu), RSS full-content (xmllint valid), sitemap, SEO/OG, Pagefind (match cả query không dấu), Giscus configurable (theme theo data-theme từ mount), Buttondown form configurable + README RSS-to-email, reading time, prev/next
- [x] Hiệu ứng §7 qua islands (TextAnimate, AnimatedShinyText, BlurFade, MagicCard, BorderBeam) + CSS thuần (underline sweep, aurora, theme-anim, micro); progress bar vanilla JS; reduced-motion e2e: trang trí tắt, 0 phần tử ẩn, progress bar VẪN chạy (scaleX 0→0.617 khi scroll)
- [x] Native View Transitions: `@view-transition` trong CSS build, navigation Chrome không lỗi, tắt khi reduced-motion
- [x] Draft test: bài `draft: true` không route/sitemap/RSS/index (verify rồi xóa bài thử)
- [x] JS budget trang bài: **102.1KB gz** ≤110 (đo phase 4 + đo lại sau review fixes; home 115.1KB — ghi nhận, ngoài tiêu chí)
- [x] URL 1 nguồn (`siteUrl`, build warning khi placeholder); 0 secret; null-config build pass + placeholder; Lighthouse mobile trang bài **100/100/100/100**

**Code review (2026-07-16):** DONE_WITH_CONCERNS → đã fix 6/8 findings (High #1 Giscus-trong-island remount, UTC date, RSS html:true, BorderBeam mount-on-hover, migrate `markdown.processor` API Astro 6, đếm tag theo slug + h2 sr-only). Bỏ qua có chủ đích: #7 conditional hook trong magic-card (code registry upstream, `mode` tĩnh trong usage của ta — không kích hoạt được); "Pagefind indexed 15 pages" là số file parse, không phải bug. Report: `reports/from-code-reviewer-to-implementer-astro-blog-full-implementation-review-report.md`.

## Rủi ro chính

- Tailwind v4 `@tailwindcss/vite` xung đột rolldown của Astro 6 → dùng `@tailwindcss/postcss` (workaround đã verify trong research report 260716)
- Component registry drift → dùng registry GỐC `magicui.design/r/*.json` (21st.dev chỉ là mirror fallback), pin shadcn CLI, review diff toàn bộ source copy + dependency delta TRƯỚC khi commit (chốt chặn supply-chain — phase 4 step 3)
- Giscus cần repo GitHub public + Discussions bật — user cấu hình ở onboarding; code phải degrade gracefully

## Out of scope

- Deploy lên host cụ thể (chốt ở onboarding bootstrap)
- i18n, CMS, TOC sticky (guidelines ghi "thêm khi có bài đủ dài")
- Search không dấu nâng cao (index bản de-accent) — chỉ probe hành vi ở phase 5, làm thêm khi user yêu cầu

## Red Team Review

### Session — 2026-07-16

**Findings:** 13 (13 accepted, 0 rejected — user chốt "Áp tất cả"; 2 finding kèm quyết định user riêng)
**Severity breakdown:** 2 Critical, 5 High, 6 Medium
**Reviewers:** Security Adversary + Failure Mode Analyst; Assumption Destroyer + Scope & Complexity Critic (báo cáo trong `reports/`)

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | `astro-pagefind` 1.8.5 peer-incompatible Astro 6 → pin `^2.0.1` | Critical | Accept | Phase 5 |
| 2 | Plan cài `framer-motion` nhưng component import `motion/react` → reduced-motion silently vô hiệu + 35KB chết | Critical | Accept | Phase 4, plan.md |
| 3 | Draft lộ qua route → sitemap → Pagefind index (chỉ lọc listing) | High | Accept | Phase 2, 3 (`getPublishedPosts()`) |
| 4 | View Transitions (nhóm 4 đã chốt trong tech-stack) rơi khỏi toàn plan — conflict tech-stack vs guidelines | High | Accept — user chốt THÊM native VT | Phase 4, plan.md, docs |
| 5 | ScrollProgress "không cần motion" sai (import `motion/react`) + `client:load` nặng nhất cho hiệu ứng ít tương tác nhất | High | Accept — user chốt VANILLA JS port từ wireframe | Phase 4 |
| 6 | `MotionConfig reducedMotion="user"` chỉ tắt transform/layout — opacity/filter vẫn chạy; SSR `opacity:0` mồ côi khi no-JS | High | Accept | Phase 4 (2 lớp: `useReducedMotion` per-island + SSR visible mặc định) |
| 7 | `example.com` placeholder độc canonical/OG/RSS/sitemap + 2 nguồn URL drift | High | Accept | Phase 3, 5, 6 (`siteUrl` 1 nguồn + build warning + README) |
| 8 | Giscus theme ban đầu theo OS (`preferred_color_scheme`), không theo `data-theme` của site | Medium | Accept | Phase 5 |
| 9 | Supply-chain: mirror 21st.dev làm primary, CLI không pin, không review diff trước commit | Medium | Accept | Phase 4 (registry gốc trước, pin CLI, diff review bắt buộc) |
| 10 | Lệnh CLI chưa verify: `--typescript` đã bỏ từ Astro 5; brace-expansion trong quote không nổ; `@w3c/xml-validator` không tồn tại | Medium | Accept | Phase 1, 3, 4 (6 lệnh riêng, `xmllint`) |
| 11 | Pagefind `forceLanguage: "vi"` là mitigation vô hiệu; query không dấu chưa test | Medium | Accept | Phase 5 (probe "nang suat" + quyết định rõ) |
| 12 | Budget 110KB zero headroom, phạm vi đo mơ hồ (Pagefind/Giscus không tính?), đo muộn ở phase 6 | Medium | Accept | Phase 4 (định nghĩa phạm vi + đo tại chỗ), 5 (lazy Pagefind), 6 |
| 13 | Buttondown RSS-to-email bị thu hẹp scope thầm lặng (tech-stack cam kết, plan chỉ có form) | Medium | Accept | Phase 5 (ghi chú), 6 (README + verify tiếng Việt) |

**Root cause chung (finding 1, 2, 5, 10):** copy version/lệnh từ research report mà không verify sống — gồm cả 1 câu hỏi report tự đánh dấu unresolved (Q4 motion). Rule rút ra: mọi version/URL/lệnh copy từ research report vào phase file phải re-verify (`npm view` / curl / `--help`) tại thời điểm planning.

### Whole-Plan Consistency Sweep — 2026-07-16

Grep toàn bộ plan files cho term cũ (`framer-motion`, `1.8.5`, `@w3c/xml-validator`, `--typescript`, `client:load`, `preferred_color_scheme`, `forceLanguage`, `21st.dev/r/`):

- Mọi hit còn lại đều là dạng giải thích "KHÔNG dùng X" hoặc nằm trong bảng findings này — không còn chỉ dẫn stale nào.
- 1 mâu thuẫn bắt được và đã sửa: phase-05 Risk vẫn khuyên `preferred_color_scheme` → đổi thành map `data-theme` → builtin `light`/`dark_dimmed` cả mount lẫn toggle.
- Term mới phủ đúng phạm vi: `getPublishedPosts()` (phase 2, 3, plan.md), `siteUrl` (phase 3, 5, 6, plan.md), View Transitions (phase 4, plan.md), phạm vi budget (phase 4 định nghĩa; 5, 6, plan.md tham chiếu).
- Docs đối soát theo quyết định user: `docs/tech-stack.md` (progress bar vanilla + native VT), `docs/design-guidelines.md` §7.4 (bỏ island ScrollProgress, VT vào scope, bỏ nhãn "tùy chọn") — hết conflict tech-stack vs guidelines.
- Không còn mâu thuẫn tồn đọng.
