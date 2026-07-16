---
name: research-report-claims-need-live-verification
description: Plans in this repo inherit stale/hallucinated versions, package names, and CLI flags from researcher reports — verify live before trusting
metadata:
  type: project
---

Plans in this repo copy factual claims verbatim from `plans/reports/researcher-*.md` files without freshness checks.

**Why:** Red-team review of `plans/260716-0832-astro-blog-build/` (2026-07-16) found 5 of 10 findings shared this root cause, including 2 Critical: astro-pagefind pinned at 1.8.5 (peer deps exclude Astro 6; 2.0.0+ required — verified via `npm view`), and `framer-motion` installed when Magic UI registry components actually depend on `motion` / import `motion/react` (verified via `curl https://magicui.design/r/{name}.json`). Also: create-astro `--typescript` flag removed since Astro 5; `@w3c/xml-validator` npm package does not exist; quoted brace expansion `"{a,b}"` in shadcn add commands is a literal no-op. One report claim was hallucinated outright (ScrollProgress "no motion lib needed").

**How to apply:** When reviewing any plan here, re-verify every version number, package name, registry URL, and CLI flag with live checks (`npm view <pkg> version peerDependencies`, curl registry JSON, shell semantics test) rather than trusting the cited research report. Also useful: `MotionConfig reducedMotion="user"` disables only transform/layout animations — opacity/filter still run, so it does NOT satisfy this project's §7.3 "no hidden elements" reduced-motion policy in `docs/design-guidelines.md`.
