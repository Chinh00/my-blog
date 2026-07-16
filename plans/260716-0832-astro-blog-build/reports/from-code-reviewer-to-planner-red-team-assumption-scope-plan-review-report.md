# Red-Team Plan Review — Astro Blog Build (260716-0832)

Reviewer: code-reviewer (adversarial: Assumption Destroyer + Scope & Complexity Critic)
Date: 2026-07-16
Scope: `plan.md` + phase-01..06 vs `docs/tech-stack.md`, `docs/design-guidelines.md`, `docs/wireframe/*.html`, research reports.
Locked user decisions (React islands/21st.dev, 4 effect groups, Astro 6, feature set, Vietnamese-only) were NOT challenged — only their implementation.

Verification methods: npm registry queries (`npm view`), live Magic UI registry JSON fetch, shell semantics test, wireframe grep, web docs (Astro v5 upgrade guide, Motion docs).

---

## Finding 1: astro-pagefind pinned at v1.8.5 — peer-dependency incompatible with Astro 6

- **Severity:** Critical
- **Lens:** Scope & Complexity Critic (Contract Verifier)
- **Location:** Phase 5, section "Architecture" and step 1
- **Flaw:** Phase 5 pins `astro-pagefind` v1.8.5, copied verbatim from the research report (dated Sep 2025). Verified against npm today: `astro-pagefind@1.8.5` declares `peerDependencies: { astro: '^2.0.4 || ^3 || ^4 || ^5' }` — Astro 6 is not allowed. Astro 6 support only landed in `2.0.0` (published 2026-05-10); current is `2.0.1` (2026-07-03), peer `^2.0.4 || ^3 || ^4 || ^5 || ^6 || ^7`.
- **Failure scenario:** `npm i astro-pagefind` (resolving to the pinned 1.8.5) in the Astro 6 project fails with ERESOLVE. An executing agent's likely "fix" is `--legacy-peer-deps`, shipping an integration never tested against Astro 6's rolldown build pipeline — search silently breaks or the build breaks at the last phase before QA.
- **Evidence:** phase-05-search-comments-newsletter.md:20 ("`astro-pagefind` v1.8.5"), :29; researcher-260716-0832 report:216 ("1.8.5 (Sep 2025)"); npm view output: `astro-pagefind@1.8.5 peerDependencies { astro: '^2.0.4 || ^3 || ^4 || ^5' }`, `2.0.0` published 2026-05-10 with `^6` support.
- **Suggested fix:** Pin `astro-pagefind@^2.0.1` in phase 5; add a plan step to re-verify any version numbers inherited from research reports older than ~2 months.

## Finding 2: Wrong animation dependency — Magic UI components depend on `motion`, plan installs `framer-motion`

- **Severity:** Critical
- **Lens:** Assumption Destroyer
- **Location:** Phase 4, sections "Related Code Files" and step 2; plan.md acceptance criteria
- **Flaw:** Phase 4 mandates `npm i framer-motion` and lists `package.json (framer-motion)`. Verified against the live Magic UI registry: every target component (`scroll-progress.json`, `blur-fade.json`, …) declares `"dependencies": ["motion"]` and imports from `"motion/react"` — the rebranded package, not `framer-motion`. The research report itself flagged this as **Unresolved Q4** ("Is `motion` package… or do we stay on `framer-motion`?"); the plan resolved the open question by silently assuming the stale answer.
- **Failure scenario:** Two compounding failures. (a) `shadcn add` auto-installs `motion`, while the plan also installs `framer-motion` → the planned `motion-provider.tsx` imports `MotionConfig` from `framer-motion` while islands consume context from `motion/react`. These are **separate module instances — the React context never connects**, so the entire reduced-motion layer (a) of phase 4 silently no-ops while everything appears to work. Plan.md acceptance "tắt hoàn toàn khi prefers-reduced-motion" fails undetectably. (b) Both runtimes end up in the post-page bundle (~35 KB gz dead weight), busting the ≤110 KB budget with no obvious cause.
- **Evidence:** phase-04-effects-islands.md:27 ("`package.json` (framer-motion)"), :31 ("`npm i framer-motion`"); plan.md:39 ("React 19 ~55KB + framer-motion + islands"); researcher report:288 (Unresolved Q4); live fetch of `https://magicui.design/r/scroll-progress.json` → `"dependencies": ["motion"]`, source `import { motion, useScroll … } from "motion/react"`; same for `blur-fade.json`.
- **Suggested fix:** Replace every `framer-motion` reference in phase 4 and plan.md with `motion`; import `MotionConfig` from `motion/react`; add an explicit step "verify all island imports resolve to a single motion package instance".

## Finding 3: `MotionConfig reducedMotion="user"` does not deliver the §7.3 contract — opacity/filter animations keep running, and SSR'd `opacity:0` orphans content

- **Severity:** High
- **Lens:** Assumption Destroyer
- **Location:** Phase 4, section "Architecture" (reduced-motion "2 lớp"), success criteria
- **Flaw:** Layer (a) of the reduced-motion strategy relies on `MotionConfig reducedMotion="user"`. Per Motion's own docs, this disables **transform and layout animations only — opacity, backgroundColor, and filter animations still run**. BlurFade/TextAnimate animate opacity + blur(filter) + translateY: under reduced-motion the y-shift stops but the element still starts at `opacity:0` and fades in — directly violating phase 4's own criterion "không animation, không phần tử ẩn" and §7.3 "không phần tử nào ẩn chờ animation". Worse: motion SSR emits initial styles inline, so island children are rendered `opacity:0` in static HTML; with JS disabled or hydration failure, content stays invisible forever — exactly the orphaned-`opacity:0` failure the guidelines' `html.fx` gate was designed to prevent, but phase 4 scopes the `.fx` gate to CSS effects only ("(b) CSS effects gate class `html.fx`").
- **Failure scenario:** User with "Reduce motion" enabled loads the home page: masthead words and cards still blur-fade in. QA in phase 6 screenshots a moment after animation completes and passes. Separately, any no-JS/failed-hydration visitor sees a blank masthead and blank card list.
- **Evidence:** phase-04-effects-islands.md:21 (2-layer strategy), :16 ("không opacity:0 mồ côi"), :41 (success criterion); design-guidelines.md:180-183 (§7.3), :161-163 (fx gate rationale), :205-207 ("kiểm tra lại reduced-motion vì các component registry thường tự xử lý"); researcher report:167-179 (Q6-A, the source of the flawed recipe); Motion docs (reducedMotion="user" disables transform/layout, preserves opacity — framer.com/motion/motion-config, motion.dev/docs/react-accessibility).
- **Suggested fix:** Make islands honor the same gate as CSS: read `matchMedia('(prefers-reduced-motion: reduce)')` (or `useReducedMotion`) inside each island and render children statically (no motion wrapper / `initial={false}`) when reduced; require SSR output to be visible by default (animate via `initial` applied only post-hydration when `.fx` present).

## Finding 4: ScrollProgress claims "không cần framer-motion" — verified false; `client:load` hydrates React+motion on every post page for a 3px bar the wireframe already does in vanilla JS

- **Severity:** High
- **Lens:** Scope & Complexity Critic (YAGNI on implementation)
- **Location:** Phase 4, section "Architecture" (component list + hydration table)
- **Flaw:** Phase 4 states ScrollProgress "không cần framer-motion" and assigns it `client:load`. Verified against the registry: `scroll-progress.tsx` imports `{ motion, useScroll } from "motion/react"` and depends on `motion`. So `client:load` forces React runtime + motion to hydrate **immediately on every post page** — the heaviest possible hydration for the least interactive effect. The wireframe already implements the identical bar in ~10 lines of rAF vanilla JS (`.fx-progress`, post.html), the research report itself says "consider vanilla JS instead", and §7.2/§7.3 additionally require the bar to **keep updating under reduced-motion** — which phase 4's blanket "mọi motion tắt" success criterion contradicts.
- **Failure scenario:** Post-page LCP/TBT degrade from eager hydration; phase 6 Lighthouse mobile ≥90 target misses; and the phase-4 fix path (MotionConfig freeze) breaks the §7.3 requirement that progress still tracks scroll, so either the a11y spec or the success criterion must be silently weakened.
- **Evidence:** phase-04-effects-islands.md:19 ("không cần framer-motion"), :20 ("ScrollProgress `client:load`"), :41 ("Reduced-motion: không animation"); registry JSON `scroll-progress.json`: `"dependencies": ["motion"]`, `import { motion, useScroll … } from "motion/react"`; docs/wireframe/post.html:470-486, 720-722 (vanilla rAF implementation, "chạy cả khi reduced-motion"); design-guidelines.md:177, 186-187; researcher report:122 (the false "No motion lib needed" claim), :156 ("consider vanilla JS instead").
- **Suggested fix:** Port the wireframe's vanilla `.fx-progress` (it already satisfies §7.3), or if the island is kept for fidelity to §7.4, correct the dependency claim, use it only where motion is already hydrated, and carve reading-progress out of the "mọi motion tắt" criterion to match §7.3.

## Finding 5: View Transitions — approved in tech stack effect group 4, absent from the entire plan

- **Severity:** High
- **Lens:** Assumption Destroyer (Scope Auditor)
- **Location:** plan.md (whole), Phase 4 "Architecture" (CSS-thuần list)
- **Flaw:** The user-approved stack explicitly lists effect group 4 as "aurora + progress bar + **View Transitions**". Grep across plan.md and all six phase files: zero occurrences of View Transitions (or ClientRouter/AnimatedThemeToggler). It is also not listed in plan.md "Out of scope", so the omission is silent, not a decision. Phase 4's CSS list covers aurora + theme transition only; the wireframes contain no view-transition code either, so nothing gets picked up "for free" by porting.
- **Failure scenario:** Plan completes, all phase criteria pass, and a user-approved feature from the locked tech stack simply never exists. Discovered at handoff as "where are the page transitions?" — rework after QA instead of a one-line scope decision now.
- **Evidence:** docs/tech-stack.md:13 ("User chốt: 4 nhóm — … aurora + progress bar + View Transitions"); grep of `plans/260716-0832-astro-blog-build/*.md` for "view.?transition" → no matches; plan.md:49-51 (Out of scope omits it); design-guidelines.md:203 (§7.4 marks it "nâng cấp tùy chọn" — conflicting with tech-stack's inclusion, a doc conflict the plan resolves silently); researcher report:204-208 (Q6-D recommendation, also ignored).
- **Suggested fix:** Either add it (Astro `<ClientRouter />`/native View Transitions is a small phase-4 step) or add an explicit "Out of scope: View Transitions (guidelines §7.4 marks optional)" line to plan.md and get the tech-stack/guidelines conflict acknowledged by the user.

## Finding 6: Phase 4's shadcn add command is a literal no-op URL — quoted brace expansion never happens

- **Severity:** Medium
- **Lens:** Scope & Complexity Critic (Contract Verifier)
- **Location:** Phase 4, step 2; Phase 3, success criteria (secondary)
- **Flaw:** `npx shadcn@latest add "https://21st.dev/r/magicui/{text-animate,animated-shiny-text,…}"` — brace expansion does not occur inside double quotes (verified in zsh: quoted form prints the literal `{…}` string). The CLI receives one malformed URL containing literal braces. The research report the plan cites uses six separate commands. The fallback "registry gốc magicui.design" names no URL form. Additionally, `https://21st.dev/r/magicui/blur-fade` returns HTTP 403 to plain curl (bot protection) — even the primary registry path is unverified connectivity-wise. Same hallucinated-contract pattern in Phase 3: `npx @w3c/xml-validator` — that scoped package does not exist on npm (verified 404; the real package is unscoped `w3c-xml-validator`).
- **Failure scenario:** Phase 4 step 2 fails on first run; executing agent improvises registry URLs under time pressure, possibly pulling components from a different registry namespace with different props than §7.4 assumes.
- **Evidence:** phase-04-effects-islands.md:31; researcher report:124-132 (individual commands); shell test: `printf '%s\n' "https://…/{a,b}"` → literal braces; `curl` → 403 on 21st.dev; phase-03-pages-seo-rss.md:41 (`npx @w3c/xml-validator`); `npm view @w3c/xml-validator` → E404.
- **Suggested fix:** Write six explicit `shadcn add` commands with the exact fallback URL form (`https://magicui.design/r/{name}.json` verified live today); replace the phantom validator with `xmllint` (already named as alternative).

## Finding 7: Phase 1 scaffold command uses a flag removed from create-astro since Astro 5

- **Severity:** Medium
- **Lens:** Assumption Destroyer
- **Location:** Phase 1, step 1
- **Flaw:** `npm create astro@latest . -- --template minimal --typescript strict --no-git`. Astro's v5 upgrade guide states the TypeScript question and its `--typescript` flag were removed from `create astro`; the Astro 6-era CLI does not accept `--typescript strict`. The `.` positional placement before `--` is also an unverified npm arg-forwarding assumption. The phase's Risk Assessment covers "non-empty dir" refusal but not flag rejection — the very first command of the whole plan has never been dry-run.
- **Failure scenario:** Step 1 errors or the flag is silently ignored; the agent proceeds with whatever tsconfig the template ships, and the "TypeScript strict" requirement quietly depends on the template default rather than the plan.
- **Evidence:** phase-01-scaffold-foundation.md:32; phase-01:47 (risk covers only dir-empty case); Astro docs "Upgrade to Astro v5": "updates the `create astro` CLI command to remove the TypeScript question" (docs.astro.build/en/guides/upgrade-to/v5/); researcher report:244-247 (its own scaffold recipe uses neither `.` nor `--typescript`, and uses `--template blog`, contradicting phase 1's `minimal`).
- **Suggested fix:** Drop `--typescript strict` (templates ship strict by default since v5); verify tsconfig extends `astro/tsconfigs/strict` as a post-step instead; state the in-place invocation form actually tested.

## Finding 8: Pagefind Vietnamese risk mitigation is a no-op — `forceLanguage: "vi"` forces the value Pagefind already auto-detects

- **Severity:** Medium
- **Lens:** Assumption Destroyer
- **Location:** Phase 5, section "Risk Assessment"; Requirements
- **Flaw:** The declared fallback if Vietnamese matching is poor is "bật `forceLanguage: 'vi'` trong config integration". Pagefind derives index language from the `<html lang>` attribute — which phase 1 already sets to `vi` (phase-01 step 6). Forcing the same value changes nothing about tokenization or matching; Vietnamese also has no Pagefind stemming support to activate. So the plan's only plan-B for its own top-listed risk is inert. The test matrix compounds this: it only tests accented queries ("năng suất"), while Vietnamese users routinely type unaccented ("nang suat") — the most likely real failure mode is never exercised and has no fallback at all.
- **Failure scenario:** Preview testing with accented keywords passes; post-launch, unaccented queries return zero results; the team flips `forceLanguage` per the plan, nothing changes, and there is no next step documented.
- **Evidence:** phase-05-search-comments-newsletter.md:42 (mitigation), :33 (test queries — all accented), :15 (requirement scoped only to "tiếng Việt có dấu"); phase-01-scaffold-foundation.md:37 (`<html lang="vi">`); tech-stack.md:21.
- **Suggested fix:** Replace the mitigation with a real one: verify accent-folded matching in Pagefind during phase 5 (add "nang suat" to the test list as an expected-behavior probe); if unsupported, decide explicitly (accept accented-only + note in README, or index a de-accented shadow via `data-pagefind-meta`) rather than pointing at an inert knob.

## Finding 9: `https://example.com` baked into canonical/OG/sitemap/robots/RSS with no task anywhere to replace it

- **Severity:** Medium
- **Lens:** Assumption Destroyer
- **Location:** Phase 3, section "Architecture" (sitemap) and step 6; Phase 6 (absence)
- **Flaw:** Phase 3 sets `site: https://example.com` "+ TODO comment (chốt domain ở onboarding)". That placeholder propagates into every SEO artifact phase 3 builds: canonical URLs, og:url/og:image absolute URLs, RSS item links, `sitemap-index.xml`, and the `Sitemap:` line in robots.txt. No phase — including phase 6 QA, which audits SEO via Lighthouse — contains a step or acceptance check that the site URL was set; "onboarding" is an unstated external dependency with no owner or gate in this plan.
- **Failure scenario:** The blog deploys; every page tells crawlers its canonical is `example.com/...`, RSS readers get dead links, and the Buttondown RSS-to-email integration (tech-stack promise) ingests example.com URLs. Nothing in phase 6 catches it because all checks run on localhost preview.
- **Evidence:** phase-03-pages-seo-rss.md:22 (placeholder decision), :26 (robots.txt), :36 (`Sitemap:` line); phase-06-qa-polish.md:21-30 (no site-URL check); plan.md:35-40 (acceptance criteria omit it), :50 (out of scope covers deploy host, not the URL value).
- **Suggested fix:** Move `site` into `src/config.ts` (phase 5 already centralizes config there — currently `url` lives in config.ts while `site` lives in astro.config.mjs, two sources of truth); add a phase 6 checklist line: "site URL set or handoff README documents exactly what to change".

## Finding 10: Buttondown scope silently narrowed — tech stack promises RSS-to-email + embed form; plan delivers form only, and the standing verification question is assigned to nobody

- **Severity:** Medium
- **Lens:** Assumption Destroyer (Scope Auditor)
- **Location:** Phase 5, section "Architecture" (Newsletter); plan.md acceptance criteria
- **Flaw:** tech-stack.md commits to "Buttondown: RSS-to-email + form đăng ký embed" and carries an open question: "Buttondown ingest ký tự tiếng Việt qua RSS-to-email — verify khi setup." The plan implements only the embed form; RSS-to-email appears nowhere in any phase, in plan.md acceptance ("Buttondown form (configurable)" only), or in Out of scope. RSS-to-email also has a concrete dependency on phase 3's feed content (full-content vs description-only determines what subscribers receive) — a design input phase 3 never considers ("full description" is specified for RSS but not evaluated against email ingestion).
- **Failure scenario:** Handoff done, user configures Buttondown, discovers RSS-to-email was never wired/documented and the Vietnamese-ingestion question from the approved stack was never tested; if the feed ships summary-only descriptions, email subscribers get truncated posts and the fix reopens phase 3 decisions post-QA.
- **Evidence:** docs/tech-stack.md:22 ("RSS-to-email + form đăng ký embed"), :38 (open question); phase-05-search-comments-newsletter.md:22 (form only); plan.md:37 ("Buttondown form (configurable)"); researcher-260715-2223-tech-stack-static-blog-report.md:84 (same unassigned question).
- **Suggested fix:** Either add a phase 5/6 line item ("document RSS-to-email setup in README §Buttondown, incl. Vietnamese-character verification step") or list RSS-to-email explicitly in plan.md Out of scope so the narrowing is a decision, not an accident.

---

## Cross-cutting observation

Findings 1, 2, 4, 6, 7 share one root cause: the plan inherits factual claims (versions, package names, CLI flags, command syntax) from research reports without freshness/liveness checks — including one claim the report itself marked unresolved (Q4) and one that is demonstrably hallucinated (ScrollProgress "no motion lib"). Recommend the planner add a standing rule: any version, URL, or command copied from a research report into a phase file must be re-verified live (npm view / curl / --help) at planning time or flagged as an assumption in the phase's Risk Assessment.

## Unresolved Questions

1. Does tech-stack.md:13 "View Transitions" mean page-navigation transitions or only the optional AnimatedThemeToggler of §7.4? The two approved docs conflict; only the user can resolve (Finding 5).
2. Is `21st.dev/r/magicui/*` reachable from the shadcn CLI at all (curl is bot-blocked)? If not, the fallback becomes the primary path and phase 4 step 2 should be rewritten around `magicui.design/r/*.json` (verified live).

Status: DONE_WITH_CONCERNS
Summary: Plan structure is executable but carries 2 Critical verified factual errors (astro-pagefind 1.8.5 incompatible with Astro 6; framer-motion vs motion package mismatch that silently breaks the reduced-motion acceptance criterion), 3 High-risk gaps (reduced-motion semantics, ScrollProgress client:load claim, missing View Transitions scope), and 5 Medium findings.
Concerns/Blockers: Findings 1 and 2 should block phase 4/5 execution until the plan text is corrected; Finding 5 needs a user scope decision.
