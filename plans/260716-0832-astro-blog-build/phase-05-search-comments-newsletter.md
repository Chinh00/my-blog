---
phase: 5
title: "Search, Giscus, newsletter"
status: completed
priority: P2
dependencies: [3]
---

# Phase 5: Search (Pagefind), Giscus, newsletter (Buttondown)

## Overview
Tìm kiếm toàn văn client-side, bình luận GitHub Discussions, form đăng ký newsletter — tất cả degrade gracefully khi chưa cấu hình.

## Requirements
- Functional: ⌘/Ctrl+K hoặc nút header mở dialog search; kết quả tiếng Việt có dấu match đúng (query không dấu: probe hành vi thật, ghi kết quả — xem Risk); Giscus render đúng theme NGAY từ lúc mount (không chỉ khi toggle); form Buttondown submit được khi có username.
- Non-functional: không island React mới (Giscus dùng vanilla script — research report Q7); config tập trung 1 file; thiếu config → placeholder lịch sự, build vẫn pass.

## Architecture
- `src/config.ts` (đã tạo ở phase 3 với `siteUrl`): MỞ RỘNG thêm title, author, giscus {repo, repoId, category, categoryId} | null, buttondownUsername | null — 1 nơi duy nhất user điền ở onboarding. KHÔNG thêm field `url` riêng — `siteUrl` là nguồn URL duy nhất (red-team: 2 nguồn sẽ drift).
- Search: `astro-pagefind@^2.0.1` — KHÔNG dùng 1.8.5: peer deps của 1.8.5 chỉ tới `^5`, Astro 6 → ERESOLVE; hỗ trợ Astro 6 từ 2.0.0 (red-team verify npm, Critical). UI = `<dialog>` port từ wireframe; Pagefind UI **dynamic import ở lần mở dialog đầu tiên** (0KB lúc tải trang — đúng phạm vi budget đã định nghĩa ở phase 4); script vanilla.
- Giscus: vanilla `<script src="https://giscus.app/client.js">` trong `giscus-comments.astro`; theme BAN ĐẦU đọc từ `document.documentElement.dataset.theme` lúc mount (KHÔNG dùng `preferred_color_scheme` — theo OS chứ không theo toggle của site, red-team: khách quay lại với theme site ngược OS sẽ thấy khung bình luận lệch màu); sync tiếp theo qua MutationObserver trên `data-theme` + `postMessage` với targetOrigin `https://giscus.app` (không `*`); `data-lang="vi"`; `data-mapping="pathname"`. Null config → render khối viền đứt "Bình luận sẽ sớm có" (như wireframe placeholder).
- Newsletter: form action `https://buttondown.com/api/emails/embed-subscribe/{username}`; null → form disabled + note. Không nhúng JS Buttondown. RSS-to-email (cam kết trong tech-stack): KHÔNG cần code — cấu hình phía dashboard Buttondown đọc `rss.xml` full-content (phase 3 đã đảm bảo); phase này ghi chú lại, phase 6 đưa hướng dẫn setup + bước verify ký tự tiếng Việt vào README.

## Related Code Files
- Create: `src/components/search-dialog.astro`, `src/components/giscus-comments.astro`
- Modify: `src/config.ts` (thêm giscus/buttondown), `astro.config.mjs` (astro-pagefind), `src/components/site-header.astro` (nút search mở dialog + phím tắt), `src/components/newsletter-form.astro` (nối config), `src/pages/bai-viet/[slug].astro` (mount Giscus)

## Implementation Steps
1. `npm i astro-pagefind@^2.0.1` + thêm integration; verify `npm run build` sinh `dist/pagefind/`.
2. Search dialog: port `<dialog>` wireframe; Pagefind UI + CSS dynamic-import ở lần mở đầu tiên (override màu bằng tokens qua `--pagefind-ui-*` variables).
3. Giscus component + theme sync + placeholder path.
4. Config file + wire newsletter form.
5. Test search bằng `npm run preview` (pagefind chỉ chạy sau build): tìm "Zettelkasten", "Hà Giang", từ có dấu "năng suất", VÀ probe không dấu "nang suat" — ghi hành vi thật (red-team: người Việt gõ không dấu thường xuyên; đây là failure mode thực tế nhất).

## Success Criteria
- [x] Search: "năng suất"/"Zettelkasten"/"Hà Giang"/"tam giác mạch" match đúng bài; **query không dấu "nang suat" CŨNG match** (Pagefind fold dấu — không cần de-accent index); kết quả chỉ gồm trang bài (`data-pagefind-body`)
- [x] Pagefind UI lazy: 0 request `/pagefind/` trước khi mở dialog, 4 request sau khi mở (e2e playwright 2026-07-16)
- [x] Giscus: config null → placeholder; config giả → script mount `data-theme="dark_dimmed"` khi localStorage=dark + OS=light (test case red-team pass), `data-lang="vi"`, mapping pathname
- [x] Newsletter: username null → input+nút disabled + note "cần cấu hình Buttondown"; có username → action POST embed-subscribe đúng endpoint
- [x] Build pass cả 2 trạng thái config (giả + null, 2026-07-16)

## Risk Assessment
- Pagefind index tiếng Việt: `forceLanguage: "vi"` KHÔNG phải mitigation — Pagefind đã auto-detect từ `<html lang="vi">` (phase 1), force lại cùng giá trị là no-op (red-team). Nếu query không dấu không match: quyết định rõ ràng — chấp nhận search có dấu + ghi chú README (mặc định, YAGNI), hoặc cân nhắc index bản không dấu qua `data-pagefind-meta` nếu user yêu cầu sau.
- Giscus theme builtin không khớp palette 100% → map `data-theme` của site sang builtin gần nhất (`light` / `dark_dimmed`) cả lúc mount lẫn khi toggle; tùy chọn custom CSS theme URL sau (ghi vào docs, không block). KHÔNG dùng `preferred_color_scheme` ở bất kỳ bước nào.
