# Red-Team Plan Review: Astro Blog Build (260716-0832)

Reviewer: code-reviewer (hostile review, two lenses: Security Adversary / Failure Mode Analyst)
Date: 2026-07-16
Scope: `plan.md` + `phase-01`…`phase-06` vs `docs/tech-stack.md`, `docs/design-guidelines.md`, `docs/wireframe/*.html`, `docs/wireframes/*.png`, 3 researcher reports.
Locked user decisions (not flagged): React islands from 21st.dev, all 4 effect groups, Astro 6, feature set, Vietnamese-only.

---

## Finding 1: Draft posts leak through routes, sitemap, and Pagefind search index

- **Severity:** High
- **Lens:** Security Adversary
- **Location:** Phase 2, section "Architecture" + Phase 3, section "Implementation Steps" + Phase 5, section "Implementation Steps"
- **Flaw:** Draft exclusion is scoped only to "listing/RSS" (phase-02-content-collections.md:22: "lọc `draft: true` khỏi mọi listing/RSS ở production build"). Phase 3 step 3 builds routes via "`getStaticPaths` từ collection" with no draft filter (phase-03-pages-seo-rss.md:33). Nothing anywhere excludes drafts from the built page set.
- **Failure scenario:** A draft post ("nháp" containing half-written personal content) is built as a live page at `/bai-viet/{slug}/`. `@astrojs/sitemap` auto-generates entries from all built routes (phase-03-pages-seo-rss.md:22) → the draft URL is published in `sitemap-index.xml` and advertised via the `Sitemap:` line in robots.txt (phase-03-pages-seo-rss.md:36). Pagefind then indexes the entire `dist/` (phase-05-search-comments-newsletter.md:29) → any visitor typing a keyword into the ⌘K dialog surfaces the full draft text. The "hidden but published" draft is discoverable by search engines and every reader. No success criterion in phase 2, 3, 5, or 6 tests that a draft is unreachable.
- **Evidence:** phase-02-content-collections.md:22; phase-03-pages-seo-rss.md:33; phase-03-pages-seo-rss.md:22,36; phase-05-search-comments-newsletter.md:29; phase-06-qa-polish.md:21-30 (no draft check in QA checklist).
- **Suggested fix:** Define draft exclusion at the route level: filter `draft` in `getStaticPaths` (drafts get no page → no sitemap entry, no Pagefind index entry). Add a success criterion to phase 2 or 6: "bài `draft: true` không có route, không xuất hiện trong sitemap, RSS, và kết quả search trên build production".

## Finding 2: View Transitions — part of the locked 4th effect group — is silently dropped from all six phases

- **Severity:** High
- **Lens:** Failure Mode Analyst
- **Location:** Phase 4 (entire file) + plan.md, section "Acceptance criteria"
- **Flaw:** The user-approved tech stack locks effect group 4 as "aurora + progress bar + View Transitions" (docs/tech-stack.md:13). Grep across the entire plan directory returns zero mentions of View Transitions / ClientRouter. Phase 4 implements aurora (CSS) and ScrollProgress, but no View Transitions in any form. design-guidelines.md:203 demotes it to an optional theme-toggle upgrade — a conflict between two user-approved docs that the plan resolves silently in favor of dropping the feature, without surfacing the conflict.
- **Failure scenario:** All phases complete, all acceptance criteria in plan.md:35-40 pass (they never mention View Transitions), phase 6 signs off — and the delivered blog is missing a feature the user explicitly approved in the bootstrap gate. The omission is undetectable by the plan's own QA because the acceptance criteria were written from the guidelines doc, not the tech-stack doc.
- **Evidence:** docs/tech-stack.md:13 ("4 nhóm — … aurora + progress bar + View Transitions"); plan.md:38 (effects criterion cites only "§7 design guidelines"); phase-04-effects-islands.md:22 (CSS-pure list: "underline sweep, aurora masthead, theme transition, nút micro-interaction" — no VT); design-guidelines.md:203 ("nâng cấp tùy chọn: AnimatedThemeToggler (View Transitions API)"); researcher-260716-0832-astro-react-islands-21st-dev-report.md:204-208 (Q6-D recommends native View Transitions for post-to-post fade — never picked up by any phase).
- **Suggested fix:** Surface the tech-stack vs guidelines conflict to the user before phase 4. If group 4 stands as locked, add native View Transitions (CSS `@view-transition` cross-document rule, near-zero JS per research report Q6-D) to phase 4 scope and to plan.md acceptance criteria; gate it behind `prefers-reduced-motion` like everything else.

## Finding 3: ScrollProgress "no framer-motion" claim is factually wrong, and phase 4's reduced-motion criterion contradicts the design spec

- **Severity:** High
- **Lens:** Failure Mode Analyst (Fact Checker)
- **Location:** Phase 4, sections "Architecture" and "Success Criteria"
- **Flaw:** Phase 4 asserts ScrollProgress is "client:load, không cần framer-motion" (phase-04-effects-islands.md:19), inherited from the research report's claim "CSS + JS … No motion lib needed" (researcher-260716-0832…report.md:122). Verified against Magic UI docs: the actual `magicui/scroll-progress` component imports `useScroll` from Motion for React (magicui.design/docs/components/scroll-progress; motion.dev/docs/react-use-scroll). The plan's premise for putting a `client:load` island on every post page is false. Separately, phase 4's success criterion "Reduced-motion: không animation" (phase-04-effects-islands.md:41) contradicts design-guidelines.md:177,186-187, which explicitly require the reading-progress bar to keep updating under `prefers-reduced-motion: reduce`.
- **Failure scenario:** (a) Implementer adds ScrollProgress per plan → React runtime + motion hydrate eagerly (`client:load`) on every post page, blowing the LCP and budget assumptions built on "no motion lib". (b) QA in phase 6 reads phase 4's criterion literally, sees the progress bar moving under forced reduced-motion, files it as a failure, and someone "fixes" it by disabling the bar — directly violating §7.3 of the approved design spec.
- **Evidence:** phase-04-effects-islands.md:19,41; researcher-260716-0832-astro-react-islands-21st-dev-report.md:122,156; design-guidelines.md:177 ("vẫn chạy khi reduced-motion, không transition"), design-guidelines.md:186-187.
- **Suggested fix:** Implement reading progress as vanilla JS + CSS (the research report itself suggests "consider vanilla JS instead" at line 156, and the wireframe already has a working rAF implementation) — this deletes the only `client:load` island from the post page. Rewrite phase 4's reduced-motion criterion to carve out the progress bar per §7.3.

## Finding 4: `site: https://example.com` placeholder poisons canonical, OG, RSS, and sitemap with no handoff gate — plus a second, divergent URL source of truth

- **Severity:** High
- **Lens:** Failure Mode Analyst
- **Location:** Phase 3, section "Architecture" + Phase 5, section "Architecture" + Phase 6, section "Implementation Steps"
- **Flaw:** Phase 3 sets `site` to `https://example.com` + TODO comment (phase-03-pages-seo-rss.md:22). Canonical URLs, og:url, RSS item links, sitemap URLs, and the robots.txt `Sitemap:` line all derive from this value. Phase 5 then introduces a *second* URL field, `url` in `src/config.ts` (phase-05-search-comments-newsletter.md:19), with no stated relationship to `astro.config.mjs`'s `site`. Phase 6's QA checklist (phase-06-qa-polish.md:21-30) never verifies the site value, and the README step (phase-06-qa-polish.md:29) lists Giscus/Buttondown config but not domain config.
- **Failure scenario:** User deploys to Cloudflare Pages after onboarding without touching `astro.config.mjs`. Every page ships `<link rel="canonical" href="https://example.com/...">` → search engines attribute all content to example.com (SEO self-sabotage that persists in indexes for weeks after fixing). RSS subscribers get dead example.com links; the sitemap submitted to Search Console is rejected. Or: user edits `src/config.ts` `url` (the "1 nơi duy nhất user điền" per phase-05:19) believing that's the single config point, while `astro.config.mjs` keeps example.com — the two silently diverge.
- **Evidence:** phase-03-pages-seo-rss.md:20,22; phase-05-search-comments-newsletter.md:19 ("1 nơi duy nhất user điền ở onboarding"); phase-06-qa-polish.md:21-30 (no site-value check); plan.md:35-40 (no acceptance criterion on URLs).
- **Suggested fix:** Single source: `astro.config.mjs` reads the URL from `src/config.ts` (or vice versa) so there is genuinely one place to edit. Add to phase 6 checklist and README: "set real domain before deploy; build fails or warns loudly while `site` is example.com" (a 3-line check in config is enough).

## Finding 5: Giscus theme sync is internally contradictory — initial iframe theme follows OS, not the site toggle

- **Severity:** Medium
- **Lens:** Failure Mode Analyst
- **Location:** Phase 5, sections "Architecture" and "Risk Assessment"
- **Flaw:** Architecture says Giscus `data-theme` syncs with the toggle via MutationObserver + postMessage (phase-05-search-comments-newsletter.md:21). Risk Assessment says "dùng theme `preferred_color_scheme` trước" (phase-05-search-comments-newsletter.md:43). These contradict: `preferred_color_scheme` makes the iframe follow the OS setting, while the site theme comes from `localStorage` + `data-theme` (design-guidelines.md:88-89). The MutationObserver only fires on *changes* after load — it never corrects the initial state.
- **Failure scenario:** Returning visitor has OS in light mode but chose dark on the site last visit. Head script sets `data-theme="dark"` before Giscus mounts → no mutation ever fires → Giscus loads with `preferred_color_scheme` = light. Result: a glaring white comment box inside a dark page — precisely the failure design-guidelines.md:92 mandates against ("Giscus/Pagefind khi tích hợp phải sync theme theo `data-theme`"). Phase 5's success criterion "theme đổi theo toggle" (phase-05:37) only tests toggle-driven changes, so QA passes while the initial-load mismatch ships.
- **Evidence:** phase-05-search-comments-newsletter.md:21,37,43; design-guidelines.md:88-92.
- **Suggested fix:** Set the Giscus script's initial `data-theme` from the current `document.documentElement.dataset.theme` at mount time (values `light`/`dark_dimmed` or custom CSS URL), keep the MutationObserver + postMessage (target origin `https://giscus.app`, not `*`) for subsequent toggles. Add "load page with localStorage theme opposite to OS theme" to phase 5 success criteria.

## Finding 6: Remote registry install has no code-review/pinning protocol — third-party mirror fetch, unpinned CLI, silent fallback swap

- **Severity:** Medium
- **Lens:** Security Adversary
- **Location:** Phase 4, section "Implementation Steps" + plan.md, section "Rủi ro chính"
- **Flaw:** Phase 4 step 2 fetches component source from `https://21st.dev/r/magicui/…` via unpinned `npx shadcn@latest` (phase-04-effects-islands.md:30-31). shadcn registry items can declare npm `dependencies` (auto-installed) and write arbitrary file paths into the repo. The plan's mitigation is "pin version sau khi add, commit source vào repo" (plan.md:45) — pinning *after* the fetch does nothing against a compromised or tampered registry payload at fetch time. There is no step to diff/review the fetched code before committing, and step 2's mid-install fallback ("nếu URL 21st.dev fail, fallback registry gốc magicui.design") means the actual provenance of committed code is ambiguous. Note: 21st.dev is a re-hosting mirror of Magic UI components; the canonical registry is magicui.design — the plan uses the mirror as primary and the origin as fallback.
- **Failure scenario:** A tampered registry JSON on the mirror adds a typosquatted npm dependency or injects a fetch beacon into `blur-fade.tsx`. `npx shadcn add` installs the dep and writes the file; the implementer commits `src/components/ui/*` unread ("source copy vào repo → kiểm soát version", phase-04:19, creates false confidence). The injected JS then hydrates on every visitor's browser on every page containing the island. Nothing in phase 4 or phase 6 (console-error check only, phase-06:35) would catch an exfil script that doesn't error.
- **Evidence:** phase-04-effects-islands.md:19,30-31,45; plan.md:45; phase-06-qa-polish.md:35.
- **Suggested fix:** Reverse the source order (canonical magicui.design registry first, mirror as fallback), pin the CLI (`npx shadcn@2.x.y`), and add an explicit step: "đọc diff toàn bộ file registry vừa copy + `package.json` dependency delta trước khi commit; chỉ chấp nhận deps đã dự kiến (framer-motion, clsx/tailwind-merge)".

## Finding 7: Phase 1 scaffold command uses a CLI flag removed in Astro v5 — the very first command of the plan is unverified

- **Severity:** Medium
- **Lens:** Failure Mode Analyst (Fact Checker)
- **Location:** Phase 1, section "Implementation Steps", step 1
- **Flaw:** `npm create astro@latest . -- --template minimal --typescript strict --no-git` (phase-01-scaffold-foundation.md:32). The `--typescript` flag was removed from create-astro in Astro v5 (2024) — strict is now the unconditional default and the flag no longer exists (docs.astro.build/en/guides/upgrade-to/v5). The command also passes no `--yes`/`--install` decision, so remaining prompts run interactively. The phase's risk assessment covers the non-empty-directory case (phase-01:47) but not the stale flag.
- **Failure scenario:** The command either errors on the unknown flag or drops into interactive prompts mid-automation. The implementing agent then improvises ("fixes" the command, or scaffolds with different options), and the deviation cascades: wrong template, deps auto-installed or not, git re-initialized despite `--no-git` intent. First command of a 6-phase plan failing on contact is a credibility signal that the other CLI invocations (phase-04:30 `shadcn init -t astro`, phase-03:41 `npx @w3c/xml-validator` — a package whose existence is likewise unverified) were transcribed, not tested.
- **Evidence:** phase-01-scaffold-foundation.md:32,47; phase-03-pages-seo-rss.md:41; researcher-260716-0832…report.md:244-247 (report's own scaffold command differs: `--template blog`, no `--typescript` flag).
- **Suggested fix:** Correct step 1 to current CLI syntax (`npm create astro@latest . -- --template minimal --no-git --install --yes` or explicit prompt handling; TS strict is default). Do a 5-minute dry-run pass over every CLI command in phases 1-5 against current docs before execution; replace `npx @w3c/xml-validator` with a verified validator (`xmllint` is already the stated alternative).

## Finding 8: JS budget has zero headroom and the accounting omits Pagefind UI and Giscus — the phase 6 gate is set up to fail late

- **Severity:** Medium
- **Lens:** Failure Mode Analyst
- **Location:** plan.md, section "Acceptance criteria" + Phase 5, section "Implementation Steps" + Phase 6, section "Implementation Steps"
- **Flaw:** The ≤ ~110KB gz post-page budget (plan.md:39) is itemized as "React 19 ~55KB + framer-motion + islands" — exactly the research report's estimate ceiling of "~95–110 KB" (researcher-260716-0832…report.md:143-150), i.e., zero headroom before a single unplanned byte. The only identified reduction (LazyMotion, ~15-20KB) is an *unresolved question* in the same report (line 286: does shadcn add ship LazyMotion-ready components? unknown). Meanwhile the budget accounting excludes: Pagefind UI JS mounted via the search dialog present in the header of every page (phase-05:30 specifies mounting UI + CSS bundle, with no lazy-load-on-open step), the Giscus `client.js` + iframe payload on post pages (phase-05:21), and — per Finding 3 — a motion-dependent ScrollProgress island hydrating at `client:load`.
- **Failure scenario:** Phase 6 step 6 measures the real number (phase-06:27): React 55 + full framer-motion ~40 + Pagefind UI + Giscus ≈ 115-130KB gz. The budget criterion and the Lighthouse ≥90 mobile criterion (phase-06:33-34) both fail at the last phase, after phases 4 and 5 are "done". Per phase 6's own rule ("regression → fix tại phase gây lỗi, không weaken tiêu chí", phase-06:16), this forces reopening two completed phases under pressure — the classic late-integration crunch the budget was supposed to prevent.
- **Evidence:** plan.md:39; researcher-260716-0832-astro-react-islands-21st-dev-report.md:143-150,286; phase-05-search-comments-newsletter.md:21,30; phase-06-qa-polish.md:16,27,33-34.
- **Suggested fix:** (a) State explicitly what counts against the 110KB (islands only vs all page JS) and add line items for Pagefind UI + Giscus. (b) Specify lazy-loading Pagefind UI only on first dialog open (dynamic import in the dialog script) — it then costs 0KB at page load. (c) Move the bundle measurement from phase 6 into phase 4's and phase 5's success criteria so overruns surface in the phase that causes them. (d) Resolve the LazyMotion question during phase 4 step 3, not after.

---

## Verification sources (external fact-checks)

- Magic UI ScrollProgress uses Motion's `useScroll`: [magicui.design/docs/components/scroll-progress](https://magicui.design/docs/components/scroll-progress), [motion.dev/docs/react-use-scroll](https://motion.dev/docs/react-use-scroll)
- `--typescript` flag removed from create-astro in Astro v5: [docs.astro.build/en/guides/upgrade-to/v5](https://docs.astro.build/en/guides/upgrade-to/v5/), [docs.astro.build/en/reference/cli-reference](https://docs.astro.build/en/reference/cli-reference/)

## Verified non-issues (documented per threat-model rule)

- Buttondown endpoint `https://buttondown.com/api/emails/embed-subscribe/{username}` matches the wireframe's integration comment (docs/wireframe/home.html:585) and current Buttondown domain.
- Visual-diff baselines exist: `docs/wireframes/*.png` (7 files, created 2026-07-16) — though coverage is partial (no tags-dark/about-dark/404 baselines), phase 6 step 2's "lệch đáng kể phải fix hoặc ghi nhận lý do" absorbs this.
- Giscus repoId/categoryId in `src/config.ts` are not secrets (public in served HTML by design); no secret-handling violation.
- Search dialog markup, ⌘/Ctrl+K handler, and `fx` gate script all exist in the wireframe as claimed (docs/wireframe/home.html:610-641, :25).
- Pagefind Vietnamese: `<html lang="vi">` (phase-01:37) is what Pagefind reads for language detection; the phase 5 risk note is directionally right, though `forceLanguage` as an *astro-pagefind integration option* should be verified at implementation time.

## Unresolved questions for planner

1. Does the user consider View Transitions in-scope (tech-stack.md:13) or optional (design-guidelines.md:203)? This must go back to the user — two approved docs conflict.
2. What exactly does the 110KB budget cover — islands only, or all JS on the post page including Pagefind UI and Giscus?

Status: DONE_WITH_CONCERNS
Summary: Plan is executable in outline but carries 4 High findings — draft-content exposure via search/sitemap, a silently dropped locked feature (View Transitions), a false ScrollProgress dependency claim contradicting the reduced-motion spec, and an example.com placeholder with no handoff gate — plus 4 Medium findings on supply-chain review, Giscus theme sync, stale CLI flags, and zero-headroom budget accounting.
Concerns/Blockers: Finding 2 requires a user decision (doc conflict) before phase 4; Findings 1 and 4 should be fixed in the plan text before phase 2/3 execution.
