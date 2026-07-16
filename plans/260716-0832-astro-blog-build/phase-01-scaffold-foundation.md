---
phase: 1
title: "Scaffold & nền design"
status: completed
priority: P1
dependencies: []
---

# Phase 1: Scaffold & nền design

## Overview
Khởi tạo Astro 6 trong repo hiện có, wire React + Tailwind (PostCSS), dựng design tokens + BaseLayout + Header/Footer từ wireframe.

## Requirements
- Functional: dev server chạy, 1 trang placeholder render đúng token Warm Serif cả light/dark, toggle theme hoạt động không FOUC.
- Non-functional: `astro check` 0 lỗi; static output (không adapter); giữ nguyên `docs/`, `plans/`, `.git`.

## Architecture
- Astro 6, template minimal, TypeScript strict, scaffold in-place tại repo root (KHÔNG dùng template blog — design riêng đã có).
- Tailwind v4 qua `@tailwindcss/postcss` (KHÔNG dùng `@tailwindcss/vite` — xung đột rolldon bundler của Astro 6, xem research report 260716 Q1).
- Design tokens = CSS custom properties thuần (nguồn: `docs/design-guidelines.md` §1) — Tailwind chỉ phục vụ component registry ở phase 4.
- Theme: `data-theme` trên `<html>` + script chống FOUC trong `<head>` (port nguyên từ wireframe), `color-scheme` tương ứng.

## Related Code Files
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json` (paths `@/*` → `./src/*`), `postcss.config.mjs`, `.gitignore`
- Create: `src/styles/global.css` (`@import "tailwindcss"` + `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` + toàn bộ tokens §1 + base prose)
- Create: `src/layouts/base-layout.astro` (fonts Google: Lora 400/500/600 italic + Be Vietnam Pro 400–800, subset vietnamese, preconnect + display=swap; theme script; `.fx` gate script theo §7.1)
- Create: `src/components/site-header.astro`, `src/components/site-footer.astro`, `src/components/theme-toggle.astro` (port markup/CSS từ `docs/wireframe/home.html`)
- Create: `src/pages/index.astro` (placeholder tạm — phase 3 thay)

## Implementation Steps
1. `npm create astro@latest . -- --template minimal --no-git --no-install` rồi `npm install` (flag `--typescript` đã bị BỎ từ Astro 5, strict là mặc định — red-team verify; repo đã có git; thư mục chỉ có docs/plans nên an toàn). Post-step bắt buộc: verify `tsconfig.json` extends `astro/tsconfigs/strict`.
2. `npx astro add react` (React 19.x + @astrojs/react).
3. Tailwind: `npm i @tailwindcss/postcss postcss autoprefixer` + tạo `postcss.config.mjs` (plugin `@tailwindcss/postcss`). KHÔNG chạy `astro add tailwind`.
4. `tsconfig.json`: thêm `baseUrl` + paths `@/*` (chuẩn bị cho shadcn phase 4).
5. Viết `global.css`: import tailwind, custom-variant dark, port tokens light/dark + typography + spacing từ guidelines §1 (không hardcode giá trị mới).
6. BaseLayout: `<html lang="vi" data-theme>`, head (fonts, theme script, fx-gate script, meta viewport), slot main, Header/Footer.
7. Port Header (logo "Chính." + nav + search button placeholder + theme toggle) và Footer từ wireframe — markup semantic giữ nguyên, CSS chuyển vào global/scoped styles.
8. `.gitignore`: node_modules, dist, .astro.

## Success Criteria
- [ ] `npm run dev` render trang placeholder đúng font/màu cả 2 theme, không FOUC
- [ ] `astro check` + `npm run build` pass, `dist/` là static thuần
- [ ] Toggle theme lưu localStorage, sync `prefers-color-scheme` lần đầu

## Risk Assessment
- Scaffold in-place có thể đòi thư mục rỗng → nếu CLI từ chối: scaffold ra thư mục tạm rồi move file vào root (giữ docs/plans nguyên vẹn).
- Nếu postcss workaround vẫn lỗi với phiên bản Astro hiện tại: pin `@tailwindcss/postcss` version trong research report; báo lại nếu không qua được.
