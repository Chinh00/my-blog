---
phase: 6
title: "QA, a11y, polish"
status: completed
priority: P2
dependencies: [4, 5]
---

# Phase 6: QA, a11y, polish

## Overview
Kiểm định toàn site: build/type, visual khớp wireframe, accessibility, hiệu năng, tiếng Việt, chuẩn bị bàn giao.

## Requirements
- Functional: mọi acceptance criteria của plan.md pass và có bằng chứng (số đo, screenshot).
- Non-functional: không sửa scope; regression → fix tại phase gây lỗi, không weaken tiêu chí.

## Architecture
Không code mới ngoài fix. Checklist-driven.

## Implementation Steps
1. `astro check` + `npm run build` + `npm run preview` sạch lỗi/warning đáng kể.
2. Visual diff: screenshot 1280 light/dark + 375 cho 5 trang, so với `docs/wireframes/*.png` — lệch đáng kể phải fix hoặc ghi nhận lý do.
3. A11y pass: heading order, 1 h1/trang, `aria-current` nav, focus-visible mọi interactive, touch target ≥44px, alt tiếng Việt, contrast spot-check bằng tokens đã verify.
4. Reduced-motion end-to-end (islands + CSS) — hiệu ứng trang trí tắt, nội dung hiện ngay, reading progress bar VẪN cập nhật (ngoại lệ §7.3 — không được coi là fail); chụp bằng chứng.
5. Lighthouse (chrome headless hoặc `npx lighthouse`): Performance/A11y/Best-practices/SEO — target ≥90 mobile cho trang bài viết; ghi số thật.
6. Bundle audit: xác nhận lại số đo phase 4 (≤110KB gz trang bài) theo ĐÚNG phạm vi định nghĩa ở phase 4 Requirements — JS first-party hydrate lúc tải; Pagefind UI (lazy) và Giscus iframe ngoài phạm vi. Đo lần nữa trên build cuối, ghi số thật.
7. Site URL check (red-team): verify `siteUrl` trong `src/config.ts` — nếu còn `example.com`, build phải in cảnh báo (phase 3) và README phải ghi RÕ chỗ đổi domain trước khi deploy; canonical/RSS/sitemap không hardcode URL nào khác (grep).
8. Kiểm tiếng Việt: dấu render đúng cả 2 font ở heading/body/code caption; ngày định dạng "15 tháng 6, 2026"; RSS hiển thị UTF-8 đúng.
9. `README.md` gốc repo: ngắn (chạy dev, viết bài mới, cấu hình Giscus, Buttondown — gồm hướng dẫn bật RSS-to-email trên dashboard trỏ vào `rss.xml` + bước verify ký tự tiếng Việt trong email đầu tiên, đổi `siteUrl` trước deploy, build) — docs chi tiết do bootstrap docs phase đảm nhiệm.
10. Dọn: xóa placeholder/console.log/file thừa; verify `.gitignore` đủ.

## Success Criteria
- [x] Toàn bộ acceptance criteria plan.md check với bằng chứng (screenshots + e2e playwright + số đo, 2026-07-16)
- [x] Lighthouse mobile trang bài: **100/100/100/100** (Perf/A11y/BP/SEO). 2 fix trong phase: fonts CSS async (FCP 4.2s→0.8s), token `--tag-ink` #9A5230 (contrast pill 4.04→4.69:1)
- [x] 0 lỗi console trên 5 trang chính × light+dark (playwright)
- [x] README đủ 3 mục onboarding: `siteUrl`, Giscus, Buttondown (form + RSS-to-email + bước verify tiếng Việt)

## Risk Assessment
- Lighthouse perf có thể tụt do motion islands → tối ưu bằng hydration directive (`client:visible`/`client:idle`, không island `client:load` nào) + LazyMotion trước, chỉ báo cáo trade-off nếu vẫn <90 (quyết định user: island là chấp nhận đánh đổi).
