# Design Guidelines — my-blog

Direction: **Warm Serif** — ấm áp, editorial, tập trung vào trải nghiệm đọc dài.
Wireframe tham chiếu: `docs/wireframe/{home,post,tags,about}.html` (mở trực tiếp bằng trình duyệt).
Nghiên cứu nền: `plans/reports/researcher-260715-2223-blog-design-trends-report.md`.

## 1. Design tokens (CSS custom properties)

Khai báo trên `:root` (light) và ghi đè qua `[data-theme="dark"]`. Không dùng trắng/đen thuần.

### 1.1 Màu

| Token | Light | Dark | Dùng cho |
|---|---|---|---|
| `--bg` | `#FAFAF8` | `#1A1A1A` | Nền trang |
| `--surface` | `#F1EEE7` | `#242220` | Nền card newsletter, code block, input, dialog |
| `--text` | `#1A1A1A` | `#F0EDE8` | Chữ chính |
| `--muted` | `#6E6A63` | `#A39F96` | Meta/byline/chú thích (~60%, vẫn đạt AA ≥4.5:1) |
| `--border` | `#E3E0D8` | `#3A3733` | Viền card, divider, header/footer |
| `--accent` | `#D4845C` | `#E5C287` | Trang trí: viền hover, blockquote, nút, logo dot |
| `--accent-ink` | `#A85B32` | `#E5C287` | Link & chữ nhỏ màu nhấn (đạt AA trên `--bg`) |
| `--accent-soft` | `#F5E4D9` | `#332B1D` | Nền tag pill, `::selection` |
| `--tag-ink` | `#9A5230` | `#E5C287` | Chữ TRÊN `--accent-soft` — 4.69:1 light / 8.24:1 dark (`--accent-ink` chỉ đạt 4.04:1 trên nền pill; Lighthouse a11y 2026-07-16) |
| `--on-accent` | `#2B1B10` | `#2B1B10` | Chữ trên nền `--accent` (đạt AA cả 2 theme) |

Quy tắc quan trọng: terracotta `#D4845C` chỉ đạt 2.6:1 trên nền sáng → **không** dùng làm màu chữ
ở light mode; chữ màu nhấn phải dùng `--accent-ink`.

### 1.2 Chữ

```css
--font-body: 'Lora', Georgia, 'Times New Roman', serif;
--font-heading: 'Be Vietnam Pro', -apple-system, 'Segoe UI', Roboto, sans-serif;
--font-mono: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

--text-sm: 0.875rem;        /* 14px — meta, byline, footer */
--text-caption: 0.9375rem;  /* 15px — chú thích ảnh (~90% body) */
--text-base: 1.0625rem;     /* 17px — body */
--text-lg: 1.1875rem;       /* 19px — sapo/lead */
--text-h3: 1.5rem;          /* 24px */
--text-h2: clamp(1.75rem, 1.5vw + 1.3rem, 2rem);        /* 28→32px */
--text-h1: clamp(2rem, 3vw + 1.1rem, 2.5rem);           /* 32→40px */
--text-display: clamp(2.125rem, 4vw + 1.05rem, 2.875rem); /* 34→46px — masthead, tiêu đề bài */

--leading-tight: 1.15;   /* display/H1 */
--leading-heading: 1.25; /* H2–H4 */
--leading-body: 1.55;    /* body */
--tracking-body: 0.3px;  /* chỉ áp cho body serif */
```

### 1.3 Khoảng cách (thang 4px)

```css
--space-1: 0.25rem;  --space-2: 0.5rem;  --space-3: 0.75rem;
--space-4: 1rem;     --space-5: 1.5rem;  --space-6: 2rem;
--space-7: 3rem;     --space-8: 4rem;    --space-9: 6rem;
```

Nhịp dùng chuẩn: gap giữa card `--space-4`; padding card `--space-5`; H2 trong bài cách trên
`--space-7`; section lớn cách nhau `--space-8`; footer cách nội dung `--space-9`.

### 1.4 Bo góc, bóng, khung

```css
--radius-sm: 6px;    /* nút, input, inline code, icon button */
--radius-md: 12px;   /* card, code block, newsletter, dialog, ảnh */
--radius-full: 999px;/* tag pill */
--content: 700px;    /* ~66ch với Lora 17px — mọi cột nội dung */
--shadow: 0 1px 2px rgb(26 26 26/.04), 0 6px 16px rgb(26 26 26/.06);
```

Layout: một cột duy nhất, `width: min(var(--content), 100% - 2.5rem)`, căn giữa.
Header/footer dùng chung bề rộng với cột nội dung.

## 2. Typography tiếng Việt

- Google Fonts subset `vietnamese`: Lora (400/500/600 + italic) và Be Vietnam Pro (400–800).
  Cả hai xử lý đúng dấu chồng (ế, ậ, ỗ, ữ…). Luôn `display=swap` + `preconnect`.
- Body: Lora 17px / line-height 1.55 / letter-spacing +0.3px — dư khoảng dọc cho dấu.
- Heading: Be Vietnam Pro 700, letter-spacing −0.015em (KHÔNG áp tracking dương cho heading).
- Không dùng font weight <400 ở cỡ body (dấu tiếng Việt vỡ nét).
- Không viết hoa toàn bộ (uppercase) câu tiếng Việt dài — dấu sát nhau khó đọc; nếu cần
  nhấn dùng weight/màu.
- Chú thích ảnh: sans-serif 15px, màu `--muted`, căn giữa.
- Ngày tháng viết dạng "15 tháng 6, 2026"; meta dùng `<time datetime="...">`.

## 3. Dark mode

- Cơ chế: `data-theme="light|dark"` trên `<html>` + token ghi đè; lưu `localStorage.theme`,
  lần đầu sync `prefers-color-scheme`. Script đặt theme phải chạy trong `<head>` (chống FOUC).
- Đặt `color-scheme: light|dark` tương ứng để form/scrollbar native đúng theme.
- Icon toggle: light hiện trăng, dark hiện mặt trời. Nút 44×44px.
- Giscus/Pagefind khi tích hợp phải sync theme theo `data-theme`.

## 4. Component inventory

Markup chuẩn xem trong wireframe; header/footer giống hệt nhau trên mọi trang.

| Component | Quy tắc chính |
|---|---|
| **Header** | `<header>` border-bottom `--border`. Logo chữ "Chính." (Be Vietnam Pro 800, dot màu `--accent`). Nav sans 15px màu `--muted`, trang hiện tại `aria-current="page"` + gạch chân 2px `--accent`. Bên phải: nút search (mở dialog Pagefind) + nút toggle theme. Mobile: nav wrap xuống dòng dưới logo. |
| **Footer** | `<footer>` border-top, chữ 14px `--muted`. Trái: copyright; phải: RSS · GitHub · Email; dòng phụ "Dựng bằng Astro". |
| **Post card** | `<article>` viền `--border`, radius `--radius-md`, padding `--space-5`. Thứ tự: meta (date · phút đọc, sans 14px muted) → tiêu đề (sans 21px, link không gạch chân, hover đổi `--accent-ink`) → excerpt (serif body) → tag list. Hover: viền `--accent` + nâng 2px + `--shadow`. |
| **Tag pill** | Sans 13px/500, padding 4px 12px, nền `--accent-soft`, chữ `--tag-ink`, radius full. Bản to (trang chủ đề): 15px + số bài dạng `(6)` mờ 75%. |
| **Newsletter form** | Card nền `--surface`, căn giữa, tiêu đề + mô tả ngắn + hàng input/nút (stack dọc ở mobile) + ghi chú "Vận hành bởi Buttondown". Input nền `--bg`, focus viền `--accent`. Nút nền `--accent`, chữ `--on-accent`. Action trỏ endpoint embed-subscribe của Buttondown. |
| **TOC** (khi bài >5 mục) | Desktop ≥1200px: sticky bên phải ngoài cột nội dung; dưới đó: collapse `<details>` đầu bài. Sans 14px, thụt 12px mỗi cấp, mục hiện tại màu `--accent-ink`. Chưa dùng trong wireframe — thêm khi có bài đủ dài. |
| **Code block** | `pre` nền `--surface`, viền `--border`, radius `--radius-md`, mono 14px/1.6, `overflow-x:auto`. Inline code: nền `--surface`, viền, radius sm, 0.875em. |
| **Blockquote** | Border-left 3px `--accent`, padding-left `--space-5`, serif italic 18px; `<cite>` sans 14px `--muted`. |
| **Byline bài viết** | Sans 14px `--muted`: Tác giả · ngày · phút đọc, ngăn bằng "·". |
| **Ảnh + caption** | `figure` radius `--radius-md`; ảnh bài 16:9 (~1400px, WebP, có alt). Placeholder: nền gradient surface→accent-soft, viền đứt. |
| **Prev/Next** | `<nav>` 2 cột (1 cột mobile), mỗi ô: label 13px muted + tên bài sans 15px/600; hover viền `--accent`. |
| **Giscus box** | Khối viền đứt `--border`, căn giữa, tiêu đề "Bình luận" — script giscus.app mount tại đây. |
| **Search dialog** | `<dialog>` native + `::backdrop` mờ; input lớn + ghi chú; mở bằng nút header hoặc Ctrl/⌘+K — UI Pagefind nhúng vào đây. |
| **hr trong bài** | Không kẻ ngang; render "···" màu `--muted`, cách trên dưới `--space-7`. |

## 5. Interaction & accessibility

- Transition ngắn 150–250ms (màu, viền, transform nhẹ); tôn trọng `prefers-reduced-motion`.
  Toàn bộ hệ chuyển động nâng cao (reveal, shimmer, spotlight, aurora…): xem §7.
- Mọi phần tử tương tác có hover + `:focus-visible` (outline 2px `--accent`, offset 3px).
- Touch target ≥44×44px; link trong prose gạch chân offset 3px, decoration màu accent 45%.
- Breakpoint duy nhất: `max-width: 640px` (nav wrap, form stack, prev/next 1 cột).
- Semantic bắt buộc: `header/nav/main/article/footer`, `<time>`, heading đúng cấp (mỗi trang 1 `h1`).
- `<html lang="vi">`; alt ảnh mô tả đầy đủ bằng tiếng Việt.

## 6. Do / Don't

**Do**
- Giữ một cột 700px cho mọi nội dung đọc; ưu tiên khoảng trắng thay vì thêm khung.
- Dùng `--accent-ink` cho mọi chữ màu nhấn ở light mode.
- Viết giọng thân mật ("mình – bạn"), tiêu đề cụ thể, excerpt 2–3 câu có móc câu.
- Mọi màu/spacing/radius lấy từ token — không hardcode giá trị mới.

**Don't**
- Không dùng trắng `#FFF`/đen `#000` thuần; không neon bão hòa cao.
- Không hero image cỡ lớn, không carousel/auto-play, không animation chạy tự do.
- Không chữ mảnh (<400) hoặc uppercase cho tiếng Việt ở cỡ nhỏ.
- Không thêm layout lệch chuẩn (grid nhiều cột cho post list) — stacked card là chuẩn.
- Không dùng `#D4845C` làm màu chữ trên nền sáng (chỉ 2.6:1).

## 7. Motion

Hiệu ứng lấy cảm hứng 21st.dev. Wireframe demo bằng CSS/vanilla JS thuần (chạy được qua
`file://`); production dùng React island từ shadcn registry / 21st.dev — xem bảng 7.4.
Nguyên tắc: chỉ animate `opacity / transform / filter / background-*` — không đổi layout,
không layout shift (chừa sẵn không gian); không marquee, custom cursor, shader nặng.

### 7.1 Token thời lượng & easing

```css
--dur-xs: 150ms;  /* micro: nút, icon */
--dur-sm: 250ms;  /* hover: underline sweep, spotlight, border beam */
--dur-md: 450ms;  /* page-title fade (post/tags/about) */
--dur-lg: 700ms;  /* reveal: từ trong masthead, card/section */
--ease-out:   cubic-bezier(.16, 1, .3, 1);  /* mọi chuyển động "đi vào" (reveal) */
--ease-swift: cubic-bezier(.4, 0, .2, 1);   /* đổi trạng thái hover/active */
--stagger: 90ms;  /* bước trễ giữa từ / giữa card cùng lô vào viewport */
--shimmer-hi;     /* stop sáng shimmer — light: mix 50% ink+accent (3.62:1, đủ AA
                     large text, chỉ hiện thoáng qua); dark: #F6E3BE (13.8:1) */
```

**Gate JS:** script trong `<head>` thêm class `fx` vào `<html>` chỉ khi
`prefers-reduced-motion: no-preference`. Mọi rule chuyển động scope dưới `html.fx …`,
nên no-JS / reduced-motion không bao giờ có trạng thái `opacity: 0`.

### 7.2 Spec từng hiệu ứng

| Hiệu ứng | Trigger | Chuyển động | Ghi chú |
|---|---|---|---|
| Masthead reveal (home) | load, 1 lần | mỗi từ: opacity 0→1, blur 6px→0, translateY 14px→0; `--dur-lg` + `--ease-out`; delay `i × 90ms`; tagline fade-up delay .55s | từ = `span.fx-word` (inline-block) đánh dấu sẵn trong markup, `--i` inline; h1 có `aria-label` nguyên câu |
| Shimmer "Chính." | load, sau reveal 1.15s, chạy 2 lượt rồi dừng | gradient 100° ink → `--shimmer-hi` → ink, size 250%, animate `background-position` | khi nghỉ chữ là màu ink đặc (4.78:1); `background-clip:text` bọc trong `@supports` |
| Page-title fade (post/tags/about) | load, 1 lần | `.fx-title` fade-up `--dur-md`; `.fx-title-sub` (byline/desc) delay .12s | bản rút gọn của masthead reveal cho trang phụ |
| Scroll reveal | vào viewport 1 lần (IntersectionObserver, rootMargin −8%) | opacity 0→1 + translateY 14px→0, `--dur-lg`; stagger `d × 90ms` theo lô cùng vào | target: `li` bao post-card (tránh đè transition hover của card), section-title, newsletter, giscus, post-nav, figure; JS gắn class → no-JS thấy ngay |
| Underline sweep | hover | prose/filter-note: line mờ 45% luôn hiện + line accent 1px quét 0→100%; nav 2px / footer 1px quét vào | transition `background-size` `--dur-sm`; `box-decoration-break: clone` cho link xuống dòng; không áp lên `aria-current` |
| Card spotlight + border beam | hover + pointermove trên `.post-card` | `::after`: radial 200px accent 11% bám `--mx/--my`; `::before`: ring 1px radial accent (mask padding-box) | giữ lift −2px + shadow; viền card giữ `--border`, ring đảm nhiệm màu accent |
| Nút micro | hover / active | `.btn` lift −1px + shadow, active scale .97; `.icon-btn` active scale .9 | `--dur-xs` |
| Aurora masthead (home) | luôn hiển thị | 2 blob radial (accent-soft ×.7 / accent 28% ×.45) blur 64px, drift 16s/22s alternate, scale ≤1.18 | `z-index:-1` + `overflow:hidden` (không tràn ngang) + mask radial fade mọi mép (không thành khối chữ nhật); vùng đậm nhất vẫn đạt AA: muted 4.55:1, text 14.7:1 |
| Reading progress (post) | scroll (rAF throttle) | bar fixed top 3px `--accent`, `scaleX(0→1)` origin trái | phản hồi trực tiếp thao tác — vẫn chạy khi reduced-motion, không transition |
| Theme transition | click toggle | JS thêm `html.theme-anim` 350ms → transition màu nền/chữ/viền .3s toàn trang | rule gate `html.fx.theme-anim` nên tự tắt khi reduced-motion |

### 7.3 Chính sách `prefers-reduced-motion: reduce`

- Head script **không** thêm `.fx` → reveal/shimmer/sweep/spotlight/lift tắt hết, nội dung
  hiển thị ngay lập tức (không phần tử nào ẩn chờ animation).
- Rule chung `@media (prefers-reduced-motion: reduce){ * { transition/animation: none !important } }`
  giữ nguyên → aurora vẫn hiển thị nhưng **đứng yên**; `scroll-behavior: auto`.
- Reading progress vẫn cập nhật theo scroll (phản hồi trực tiếp thao tác người dùng,
  không thuộc phạm vi WCAG 2.3.3), không có transition.

### 7.4 Mapping production — React island (Astro + shadcn registry / 21st.dev)

Wireframe chỉ là demo CSS/JS thuần. Khi build Astro, thay bằng component registry,
hydrate `client:visible` / `client:idle`:

| Hiệu ứng | Component ứng viên | Nguồn |
|---|---|---|
| Masthead word reveal | `TextAnimate` (`animation="blurInUp"`, `by="word"`) hoặc `TextEffect` | Magic UI / motion-primitives (21st.dev) |
| Shimmer "Chính." | `AnimatedShinyText` hoặc `TextShimmer` | Magic UI / motion-primitives |
| Scroll reveal | `BlurFade` (`inView`, `delay` cho stagger) hoặc `InView` | Magic UI / motion-primitives |
| Underline sweep | giữ CSS thuần — không cần island | — |
| Card spotlight + beam | `MagicCard` (spotlight) + `BorderBeam`; thay thế: `CardSpotlight` | Magic UI / Aceternity (21st.dev) |
| Aurora masthead | giữ CSS thuần; nếu cần React: `AuroraBackground` giảm opacity theo token | Aceternity (21st.dev) |
| Reading progress | giữ vanilla JS thuần — port `.fx-progress` (rAF) từ wireframe; user chốt 2026-07-16 (`ScrollProgress` của Magic UI import `motion/react`, không đáng island cho 1 thanh 3px) | — |
| Theme transition | giữ CSS thuần | — |
| View Transitions chuyển trang | native `@view-transition { navigation: auto }` — CSS thuần, TRONG scope (user chốt 2026-07-16, khớp tech-stack nhóm 4); tắt trong `@media (prefers-reduced-motion: reduce)` | — |

Lưu ý production: island chỉ dùng cho hiệu ứng cần JS (reveal, shimmer, spotlight);
progress bar và View Transitions là vanilla/native CSS. Mọi component phải đọc màu qua
CSS variables của §1 — không hardcode; mỗi island tự check reduced-motion
(`useReducedMotion` từ `motion/react`) và SSR output phải visible mặc định
(không `opacity:0` từ server).
