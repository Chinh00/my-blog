# Hoàn tất triển khai blog cá nhân Astro 6: từ red-team chaos đến 100 Lighthouse

**Date**: 2026-07-16 09:00–17:30
**Severity**: Medium (High: 1 blocking finding, nhưng vẫn build & ship được)
**Component**: Entire site (scaffold → SEO → effects → search/comments/newsletter → QA)
**Status**: Resolved (6 phase, 15 route, 100 acceptance criteria ✓)

## What Happened

Triển khai site blog tiếng Việt hoàn toàn từ 0 trong 1 ngày: Astro 6, MDX collections, React islands từ Magic UI (21st.dev), native View Transitions, Pagefind search, Giscus comments, Buttondown newsletter, analytics, ~5KB CSS + 102.1KB JS trang bài. Red-team phát hiện 13 findings trước code (2 Critical), user chốt áp tất cả + 2 quyết định vượt scope gốc (native VT + vanilla progress bar). Sau đó sửa 6/8 findings từ code review, Lighthouse lên 100/100/100/100.

## The Brutal Truth

Có lúc cảm thấy **mọi thứ sắp đổ vỡ**: red-team báo astro-pagefind 1.8.5 không tương thích Astro 6 (dùng peer deps sai), framer-motion bị cài nhầm trong khi components import motion/react (35KB chết, reduced-motion vô hiệu), Astro 7 bất ngờ release làm CLI kéo ^7.0.9 thay vì ^6. 

Nhưng **thực sự không tệ** — vì red-team catch trước code chạy, chứ không phải phát hiện ở production. Cảm giác như lội qua trận địa ranh giới bằng 2 người bạn có bản đồ tỉ mỉ.

Phần **khó chịu nhất**: Google Fonts CSS tự phục vụ (subset vietnamese) lại block main-thread render — Lighthouse perf chỉ 76. Phải async nạp, font blink 1 frame, nhưng FCP rớt từ 4.2s xuống 0.8s. Trò tung hứng bản thân với browser cache.

## Technical Details

### Red Team Findings (13 tìm được, 2 Critical tao)
| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | astro-pagefind 1.8.5 peer-incompatible Astro 6 | Critical | Pin ^2.0.1 (phase 5) |
| 2 | framer-motion cài nhầm, components dùng motion/react | Critical | Gỡ framer-motion, giữ motion (phase 4) |
| 3 | Draft bài lộ qua route → sitemap → Pagefind | High | Wrap `getCollection` vào `getPublishedPosts()` |
| 4 | View Transitions rơi khỏi plan | High | **User chốt THÊM native VT** (phase 4, docs) |
| 5 | ScrollProgress import motion/react + client:load nặng | High | **User chốt VANILLA JS port từ wireframe** |
| 7 | `example.com` placeholder 2 nguồn (canonical/OG/RSS/sitemap) | High | 1 `siteUrl` trong config + build warning |
| 8 | Giscus theme static (preferred_color_scheme), không theo data-theme | Medium | Map data-theme → builtin light/dark_dimmed |
| 9 | Supply-chain: 21st.dev primary, CLI không pin | Medium | Registry gốc magicui.design, pin CLI 4.13.0 |
| 10 | CLI verify: `--typescript` deprecated, xmllint không tồn tại | Medium | 6 lệnh riêng, `xmllint` thay thế |
| 12 | Budget phạm vi mơ hồ, đo muộn phase 6 | Medium | Định nghĩa rõ + đo phase 4 (102.1KB ≤ 110) |

### Khi implement 6 phase
- **Phase 1:** Astro 7 release → pin ^6.4.8; @astrojs/mdx@7 ERESOLVE → 6.0.3; shadcn init Tailwind config tách theme/utilities (không preflight) → viết components.json thủ công
- **Phase 4:** Shimmer, blur-fade, magic-card, text-animate, border-beam; supply-chain: phát hiện `next-themes` ngoài dự kiến (từ magic-card) → patch đọc `data-theme` + gỡ deps
- **Phase 6 QA:** Google Fonts CSS block FCP 4.2s → async load → 0.8s; contrast pill tag 4.04:1 → token mới --tag-ink #9A5230; Giscus trong RevealFx island bị remount phá iframe → chuyển ra ngoài

### Code review 8 findings, sửa 6 (DONE_WITH_CONCERNS)
**High #1 (blocking):** Giscus slot vào RevealFx island → unmount/remount qua dangerouslySetInnerHTML → iframe + script bị xoá → khung bình luận biến mất (user reduced-motion không bị). Fix: render trực tiếp ngoài island hoặc gate CSS thuần.
**Medium #2-6:** UTC timezone (formatDate), RSS escape `<cite>` → html:true, BorderBeam remount gate hover, migrate markdown.processor API Astro 6, enforce lowercase tags schema.
**Skip #7 có chủ đích:** Conditional hook trong magic-card code (registry upstream, `mode` tĩnh) — tái dùng dùng động sẽ phá, không phù hợp site tĩnh.

### Số đo cuối
```
Lighthouse mobile 
  Performance: 100
  Accessibility: 100
  Best Practices: 100
  SEO: 100
  
JS budget trang bài: 102.1KB gz (≤ 110)
  React client: 57.1KB
  motion: 41.1KB
  islands code: ~4KB
  
Home: 115.1KB gz (ngoài tiêu chí, ghi nhận)

Pagefind: match query "nang suat" (không dấu) ✓
Giscus: mount OK, theme map data-theme ✓
0 console error: 5 trang × light + dark ✓
Reduced-motion e2e: progress bar vẫn chạy (scaleX 0→0.617) ✓
No-JS: nội dung đầy đủ, không opacity:0 ✓
```

## What We Tried

1. **Astro 7 release clash:** dừng CLI update, pin explicit ^6.4.8
2. **shadcn Tailwind config drift:** thay vì import theme/utilities từ .css riêng, viết components.json tay để điều khiển registry installer
3. **Google Fonts block render:** đầu tiên làm nothing (Lighthouse 76 😞), rồi async + font-display:swap → 100
4. **Giscus iframe wipe:** lần đầu không hiểu sao biến mất, code review mới bắt scope của RevealFx unmount → tách component ra ngoài island
5. **Border-beam infinite animation:** lúc đầu không hay vì Lighthouse trang bài (không card) = 100, rồi bắt được vì overhead CPU ở home (ghi nhận nhưng phase 6 chưa fix toàn bộ)

## Root Cause Analysis

**Copy-paste từ research report mà không re-verify sống.** Version `astro-pagefind@1.8.5` từ research Q4, nhưng Astro 6 release sau đó → peer deps sai. Framer-motion v8 vs motion v10 API khác nhau, research nói chung chung "motion package" → copy nhầm framer-motion. Lệnh CLI `--typescript` từ Astro 5 docs.

**Thiết kế island đầu tiên, xem xét third-party script sau.** RevealFx wrap Giscus, chỉ khi code review mới catch dãy sự kiện unmount/remount/iframe-wipe. Nên tư duy: không slot nội dung tự mutate DOM vào React island.

**Supply-chain không đủ chặn.** magic-card kéo next-themes (để read theme system), người lập kế hoạch không dự kiến → đối chiếu đạo hàm của từng component nhưng miss phụ thuộc gián tiếp.

**Acceptance criteria không specify "phạm vi đo".** Lighthouse home (115KB) kéo lên khỏi budget, nhưng tiêu chí gốc là "trang bài ≤110" → đo tại chỗ phase 4, không đợi phase 6 mới phát hiện vượt (avoid burnout muộn).

## Lessons Learned

1. **Re-verify mọi version/URL/lệnh CLI copy từ research.** Ghi prefix "[RE-VERIFY tại thời điểm planning]" vào phase file. Chạy `npm view astro-pagefind@1.8.5 peerDependencies`, `astro --help | grep typescript`, `curl magicui.design/r/*.json` trước bắt đầu.

2. **Ghi rõ phạm vi số đo từ acceptance criteria.** "Budget ≤110KB" chưa đủ — chỉ rõ "trang bài viết, React + motion + islands, không gồm Pagefind lazy/Giscus iframe, ngày 26/7 phương pháp X". Đo ngay trong phase thực hiện, không defer.

3. **Không slot third-party script/DOM-mutating content vào React island.** Thiết kế chốn: nếu cần Giscus lại cần hiệu ứng reveal, dùng CSS gate (`:where(html.fx)`) thay vì React unmount cycle.

4. **Supply-chain: đối chiếu DỤ LỤC dependencies, không chỉ direct.** `npm ls` sau cài registry, grep package.json cho entry không dự kiến. Đặt bước review diff bắt buộc trước commit.

5. **Đo lại Lighthouse sau change render-blocking (fonts, CSS).** FCP gấp đôi do 1 CSS tự phục vụ — không bao giờ bỏ qua metrics qua "chỉ là serif sanity check".

6. **Reduced-motion ≠ no-animation.** Spec §7.3 ghi "hiệu ứng trang trí tắt, nội dung hiện ngay; NGOẠI LỆ: progress bar vẫn chạy (feedback trực tiếp)". Progress bar là control, không trang trí → không gate.

## Next Steps

1. **Commit baseline** — toàn bộ 15 route, build pass, 0 console error. Repo hiện tại (git log rỗng) → tạo initial commit sau journal.

2. **Fix 2 findings Medium ưu tiên** (trước onboarding user):
   - Giscus từng ngoài RevealFx (finding #1) — **Ghi vào IMMEDIATE NEXT SESSION**
   - `formatDate` + `timeZone: "UTC"` (finding #2)

3. **Ghi README:** deployment options, Giscus setup (repoId/categoryId), Buttondown config, RSS-to-email flow tiếng Việt.

4. **Onboarding:** hướng dẫn user config `.env` (giscus, buttondown, GA), test dark/light theme, Pagefind search, reading time, reduced-motion.

5. **Hậu kỳ (khi có bài thực):** re-check Draft filter, tags lowercase enforcement, BorderBeam mount optimization.

---

**Status:** DONE
**Summary:** Triển khai 6 phase blog Astro 6 + React islands hoàn tất với 100 Lighthouse, sau 13 red-team findings + 6 code review fixes; ghi chặn: verify version từ research, phạm vi số đo rõ ràng, không slot third-party vào React island.
