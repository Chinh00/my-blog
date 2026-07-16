# Code Review — Astro Blog Full Implementation (plan 260716-0832)

Advisory review, không sửa code. Verify sống: `npx astro check` (0 errors / 0 warnings / 1 hint), `npm run build` (pass, 15 routes + rss/sitemap/robots/pagefind). Không chạy test browser theo scope — số đo e2e/Lighthouse/bundle chấp nhận theo bằng chứng phase reports.

## Đối chiếu acceptance criteria (plan.md)

| # | Criterion | Kết quả |
|---|-----------|---------|
| 1 | Build pass, static thuần, astro check 0 lỗi | ✅ verified sống — `output: "static"`, 0 errors |
| 2 | Khớp wireframe + font subset vietnamese | ✅ theo evidence phase 6 (screenshots); Google Fonts css2 tự phục vụ subset vietnamese (base-layout.astro:32) |
| 3 | Đủ tính năng (dark mode, tags, RSS full, sitemap, SEO/OG, Pagefind, Giscus, Buttondown, reading time, prev/next) | ✅ code paths đủ — NHƯNG finding #1 (Giscus bị wipe sau hydration khi cấu hình) và #3 (RSS escape `<cite>`) |
| 4 | Hiệu ứng §7 qua islands; reduced-motion đúng policy §7.3 | ✅ gate 2 lớp `useFx()` (use-fx.ts:11-20) + `html.fx` + SSR visible; progress bar vanilla không gate ([slug].astro:84-109) |
| 5 | Native View Transitions, tắt khi reduced-motion | ✅ global.css:996-1002 |
| 6 | Draft không route/sitemap/RSS/index | ✅ grep: `getCollection` duy nhất trong lib/posts.ts; mọi page/RSS đi qua `getPublishedPosts()` |
| 7 | Budget ≤110KB gz trang bài | ✅ theo số đo phase 4 (102.1KB); không re-measure trực tiếp được (hook chặn dist/) — deps nhất quán với phạm vi đo (react 19 + motion, không framer-motion) |
| 8 | 1 nguồn URL, không secret, null-config vẫn build | ✅ grep `example.com` = 1 hit (config.ts:8); giscus repoId/categoryId public-by-design có chú thích; build hiện tại chính là trạng thái null-config + placeholder render |

## Findings

### High

**1. Giscus sẽ bị xoá sạch sau hydration khi user cấu hình — vỡ criterion 3 tại đúng touchpoint onboarding**
- `src/pages/bai-viet/[slug].astro:74-76` — `<GiscusComments />` được slot vào island React `<RevealFx client:visible>`.
- Chuỗi sự kiện khi `giscus` khác null: (a) inline script trong giscus-comments.astro:25-72 chạy lúc parse HTML, inject `client.js` → giscus tạo iframe trong slot DOM; (b) island hydrate khi cuộn tới; (c) `useFx()` flip false→true sau mount (use-fx.ts:14) đổi cấu trúc cây render của RevealFx (`<div>` → `MotionConfig>BlurFade>motion.div`, reveal-fx.tsx:19-35) → React unmount/remount `<astro-slot>` (dangerouslySetInnerHTML từ HTML server gốc); (d) iframe + script tag do giscus inject bị xoá, script re-inject qua innerHTML không thực thi → khung bình luận biến mất vĩnh viễn (user reduced-motion không bị vì cây không đổi).
- Hiện chưa lộ vì `giscus = null` (placeholder tĩnh, remount vô hại). E2e phase 5 chỉ verify attrs lúc script mount — trước thời điểm wipe.
- **Fix:** render `<GiscusComments />` trực tiếp ngoài island (bỏ wrap RevealFx), hoặc reveal khối comments bằng CSS thuần gate `html.fx`. Tổng quát: không slot nội dung có script/DOM tự mutate vào island React.

### Medium

**2. `formatDate` phụ thuộc timezone máy build — lệch với `isoDate`**
- `src/lib/format-date.ts:1-10` — Intl.DateTimeFormat không có `timeZone: "UTC"` trong khi `isoDate` dùng `toISOString()` (UTC). Reproduce: `TZ=America/New_York` → label "27 tháng 6, 2026" nhưng `datetime="2026-06-28"` cho cùng pubDate. Build trên CI/máy UTC-âm sẽ hiện sai ngày toàn site một cách thầm lặng.
- **Fix:** thêm `timeZone: "UTC"` vào formatter.

**3. RSS full-content escape mất inline HTML (`<cite>`) — ảnh hưởng Buttondown RSS-to-email**
- `src/pages/rss.xml.js:7,23` — `new MarkdownIt()` mặc định `html: false` → inline HTML trong body bị escape thành text. 2/5 bài mẫu (`hoc-cach-noi-khong.mdx`, `ghi-chu-zettelkasten-mot-nam.mdx`) dùng `<cite>` trong blockquote → subscriber thấy literal `<cite>— …</cite>`. Reproduce bằng markdown-it trực tiếp.
- **Fix:** `new MarkdownIt({ html: true })` — an toàn vì sanitize-html phía sau đã là chốt (`cite` thuộc defaults.allowedTags).

**4. BorderBeam animate vô hạn kể cả khi ẩn — lệch spec §7.2 (beam là hiệu ứng hover)**
- `src/components/effects/post-list-fx.tsx:70-76` + `src/components/ui/border-beam.tsx:89-101` — `repeat: Infinity` trên `offsetDistance` (không compositor-friendly) chạy liên tục trên cả 5 card trang chủ, chỉ ẩn bằng `opacity-0`. Main-thread/pin cost thường trực; Lighthouse 100 đo ở trang bài (không có card) nên không bắt được.
- **Fix:** mount beam theo state hover (pointerenter/leave) hoặc `animation-play-state` gate `:hover`.

**5. `markdown.remarkPlugins` deprecated ở Astro 6 — warning mỗi build**
- `astro.config.mjs:23-28` — build/check in `[astro] markdown.remarkPlugins ... are deprecated`. Không chặn criterion 1 (warning, không error) nhưng sẽ vỡ ở major kế tiếp.
- **Fix (không gấp):** migrate reading-time theo API `unified({...})` của `@astrojs/markdown-remark` khi thuận tiện.

### Low

**6. Schema không enforce "tags lowercase" như phase 2 cam kết + 2 code path gộp tag khác key**
- `src/content.config.ts:13` (không transform) vs `src/pages/chu-de/index.astro:9-14` (đếm theo raw tag) vs `src/pages/chu-de/[tag].astro:10-18` (gộp theo slug). Bài viết "Cuộc sống"/"cuộc sống" → tag cloud hiện 2 pill cùng URL, count lệch route thật.
- **Fix:** `z.string().transform(t => t.trim().toLowerCase())` trong schema, hoặc key Map bằng `slugify(tag)` ở index như [tag].astro.

**7. `useMotionTemplate` gọi có điều kiện trong magic-card.tsx:183-197** — Rules of Hooks tiềm ẩn nếu prop `mode` đổi runtime (hiện bất biến "gradient"). Registry fidelity đã chấp nhận; ghi nhận để không tái dùng orb mode động mà không sửa.

**8. Tag page nhảy heading h1 → h3** — `chu-de/[tag].astro:39` (h1) rồi card h3 (post-list-fx.tsx:16), không có h2 (home có `.section-title` h2 nên không bị). A11y hint, không chặn.

## Informational (không phải bug)

- Build log `Pagefind indexed 15 pages` = số file HTML `addDirectory` parse (đối chiếu source astro-pagefind), KHÔNG phải số trang vào kết quả; `data-pagefind-body` tại [slug].astro:46 + e2e phase 5 xác nhận kết quả chỉ gồm trang bài.
- Phase 4 architecture ghi AnimatedShinyText/MagicCard/BorderBeam `client:idle`; implementation dùng `client:visible` cho mọi island — lười hơn directive kế hoạch, có lợi cho budget, vô hại.
- Supply-chain review phase 4 xác nhận đúng: không còn `next-themes`/`framer-motion` trong src lẫn package.json (grep 0 hit ngoài comment giải thích).
- Repo chưa có commit nào (`git log` rỗng, toàn bộ file untracked) — nên commit baseline trước khi tiếp tục; `plan.md` frontmatter vẫn `status: pending` dù 6 phase completed (để lead/planner cập nhật, reviewer không sửa).

## Recommended actions (ưu tiên)

1. Gỡ `RevealFx` khỏi `GiscusComments` (finding 1) — trước khi user onboard Giscus.
2. Thêm `timeZone: "UTC"` vào format-date.ts (finding 2).
3. `MarkdownIt({ html: true })` trong rss.xml.js (finding 3).
4. Gate BorderBeam theo hover thật (finding 4).
5. Lên lịch migrate remark plugin API (finding 5) + enforce lowercase tags (finding 6).

---

Status: DONE_WITH_CONCERNS
Summary: Implementation đạt 8/8 acceptance criteria ở trạng thái hiện tại (build/check verified sống, evidence phases nhất quán), nhưng có 1 finding High sẽ làm Giscus biến mất ngay khi được cấu hình (island remount nuốt DOM do script third-party inject) cùng 4 finding Medium (timezone ngày, RSS escape cite, beam chạy nền vô hạn, API deprecated).
Concerns/Blockers: Finding #1 cần fix trước onboarding Giscus; budget/Lighthouse/Pagefind không re-measure trực tiếp được (hook chặn dist/) — chấp nhận theo số đo phase 4/5/6.
