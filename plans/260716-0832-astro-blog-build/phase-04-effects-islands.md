---
phase: 4
title: "Hiệu ứng: React islands + CSS motion"
status: completed
priority: P2
dependencies: [3]
---

# Phase 4: Hiệu ứng — React islands + CSS motion

## Overview
Cài component Magic UI qua shadcn registry (quyết định user: React islands từ 21st.dev), port hiệu ứng CSS thuần từ wireframe, wire reduced-motion đúng spec §7.3, thêm native View Transitions.

## Requirements
- Functional: đủ 10 hiệu ứng theo `docs/design-guidelines.md` §7.2 + View Transitions chuyển trang (red-team: user chốt THÊM, 2026-07-16); reading progress bar dùng VANILLA JS port từ wireframe (user chốt đổi từ island, 2026-07-16).
- Non-functional: budget JS trang bài viết ≤110KB gz — phạm vi đo: mọi JS first-party + framework hydrate lúc tải trang (React runtime, motion, island code, Pagefind UI KHÔNG tính vì lazy-load khi mở dialog — phase 5; Giscus là iframe third-party on-demand, ngoài budget). Đo NGAY trong phase này, không đợi phase 6.
- `prefers-reduced-motion: reduce` → hiệu ứng trang trí tắt, nội dung hiện ngay; NGOẠI LỆ theo §7.3: reading progress bar vẫn cập nhật (phản hồi trực tiếp thao tác).

## Architecture
- Animation dependency là package **`motion`** (KHÔNG phải `framer-motion` — registry components import từ `motion/react`; red-team verify sống registry JSON. Dùng 2 package = context không nối, reduced-motion silently vô hiệu + 35KB chết).
- Islands từ registry: TextAnimate (masthead reveal), AnimatedShinyText (shimmer "Chính."), BlurFade (scroll reveal), MagicCard + BorderBeam (card spotlight/beam). ScrollProgress KHÔNG dùng island.
- Hydration: BlurFade/TextAnimate `client:visible`; AnimatedShinyText/MagicCard/BorderBeam `client:idle`. Không có island `client:load` nào.
- Reduced-motion 2 lớp — thiết kế lại theo red-team (MotionConfig `reducedMotion="user"` CHỈ tắt transform/layout, opacity/filter vẫn chạy):
  1. Mỗi island tự check `prefers-reduced-motion` (hook `useReducedMotion` từ `motion/react`) → render tĩnh (`initial={false}`, không animation props) khi reduce.
  2. SSR output phải hiển thị mặc định (KHÔNG `opacity:0` inline từ server) — animation chỉ kích hoạt sau hydration dưới gate `html.fx`. No-JS/hydration fail = nội dung vẫn thấy đầy đủ.
  - `MotionConfig reducedMotion="user"` (import từ `motion/react`) giữ như lớp phụ trong `motion-provider.tsx`.
- CSS/vanilla thuần (KHÔNG island): underline sweep, aurora masthead, theme transition, nút micro, reading progress bar (port `.fx-progress` rAF ~10 dòng từ `docs/wireframe/post.html`), native View Transitions (`@view-transition { navigation: auto; }` trong global.css + tắt trong `@media (prefers-reduced-motion: reduce)`).
- Màu island: đọc CSS variables qua className (vd `bg-[var(--accent)]`) — không truyền giá trị màu vào animate props (pitfall research Q6-C).

## Related Code Files
- Create: `components.json` (shadcn init), `src/components/ui/*` (source registry copy), `src/components/effects/motion-provider.tsx`, `src/components/effects/masthead-reveal.tsx`, `src/components/effects/post-card-fx.tsx`
- Modify: `src/pages/index.astro`, `src/pages/bai-viet/[slug].astro` (progress bar vanilla script), `src/styles/global.css` (underline sweep, aurora, theme-anim, @view-transition, .fx-progress), `package.json` (`motion`)

## Implementation Steps
1. `npx shadcn@latest init -t astro` — ghi lại version CLI thực dùng vào báo cáo phase (pin bằng `npx shadcn@{version}` cho các lệnh add tiếp theo).
2. Add component — 6 lệnh RIÊNG (brace-expansion trong quote không nổ — red-team verify zsh), registry GỐC trước, 21st.dev chỉ là mirror fallback:
   ```bash
   npx shadcn@{pinned} add "https://magicui.design/r/text-animate.json"
   npx shadcn@{pinned} add "https://magicui.design/r/animated-shiny-text.json"
   npx shadcn@{pinned} add "https://magicui.design/r/blur-fade.json"
   npx shadcn@{pinned} add "https://magicui.design/r/magic-card.json"
   npx shadcn@{pinned} add "https://magicui.design/r/border-beam.json"
   ```
   Sau đó `npm i motion` (nếu CLI chưa tự cài).
3. **Supply-chain review (bắt buộc trước commit):** đọc toàn bộ diff file copy vào `src/components/ui/*` + delta dependencies trong `package.json` — chỉ chấp nhận `motion` và deps đã dự kiến; import lạ/URL lạ/dep lạ → dừng, báo cáo.
4. Chỉnh component: màu → CSS variables; thêm nhánh reduced-motion (mục Architecture); thử LazyMotion nếu áp được không phá API (giảm ~15-20KB — ghi kết quả thật).
5. Compose islands + gắn vào pages với client directives như Architecture.
6. Port CSS effects + `.fx-progress` vanilla + `@view-transition` vào global.css, giữ token §7.1.
7. Đo bundle: `npm run build`, gzip từng chunk JS trang bài viết — ghi số thật, so budget ở Requirements. Vượt → LazyMotion/tách island trước khi sang phase khác.
8. Test reduced-motion end-to-end: Chrome headless `--force-prefers-reduced-motion` — hiệu ứng trang trí tắt, nội dung hiện ngay, progress bar VẪN chạy. Test no-JS (tắt JS): toàn bộ nội dung visible.

## Success Criteria
- [x] Hiệu ứng khớp demo wireframe (screenshot: aurora, reveal từng từ, shimmer, card fx — 2026-07-16)
- [x] Bundle JS trang bài = **102.1KB gz** ≤110KB (React client 57.1 + motion 41.1 + islands ~4; home 115.1KB gz — ngoài phạm vi tiêu chí, ghi nhận). CLI shadcn pin 4.13.0.
- [x] Reduced-motion (`--force-prefers-reduced-motion`): nội dung hiện ngay, không phần tử ẩn; progress bar vanilla không gate html.fx nên vẫn chạy (§7.3)
- [x] No-JS: SSR grep 0 `opacity:0`, đủ 5 card + masthead; mọi rule motion CSS gate dưới `html.fx`
- [x] `@view-transition` trong CSS build (2 hit: rule + reduced-motion off); test chuyển trang thật ở phase 6
- [x] Supply-chain review: đọc đủ 5 file registry + delta deps. Phát hiện `next-themes` (ngoài dự kiến, từ magic-card) → patch đọc `data-theme` + gỡ khỏi deps. Còn lại chỉ `motion`, `clsx`, `tailwind-merge` như dự kiến.

## Risk Assessment
- Registry props/URL drift → source copy vào repo, review diff bắt buộc (step 3) là chốt chặn.
- MagicCard xung đột hover CSS card có sẵn → giữ 1 nguồn hiệu ứng (island), gỡ CSS spotlight trùng.
- Shimmer `background-clip:text` Safari cũ → giữ `@supports` từ wireframe.
- `magicui.design/r/*.json` đã verify reachable (red-team); nếu component cụ thể đổi tên → tra registry index trước khi improvise.
