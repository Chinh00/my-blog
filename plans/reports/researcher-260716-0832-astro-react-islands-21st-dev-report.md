# Astro 6 React Islands + 21st.dev Animation Components: Implementation Report

**Date:** 2026-07-16 | **Astro:** 6.x (stable Feb 2026) | **React:** 19.x | **Tailwind:** v4

## Summary

Astro 6 + React islands with 21st.dev animation components is **prod-ready** via Magic UI registry (framer-motion-based). Known friction: @tailwindcss/vite conflicts with Astro 6's rolldown bundler (fallback: @tailwindcss/postcss); shadcn CLI requires manual tsconfig path aliases; CSS custom properties + data-theme work with Tailwind custom variant override; hydration budget ~85–90 KB gz for 4 islands (React 19 + motion). Pitch toward client:visible for scroll-reveal, client:idle for hover/focus effects.

---

## Q1: Astro 6 + Tailwind v4 Setup (2026)

**Install:**
```bash
npm install @astrojs/tailwind
# OR: npx astro add tailwind
```

**⚠️ Known Issue:** `astro add tailwind` installs @tailwindcss/vite v4.2.4+, which fails on Astro 6 default rolldown bundler ("Missing field `tsconfigPaths`" error).

**Workaround A (Recommended):** Manually use @tailwindcss/postcss instead:
```bash
npm uninstall @tailwindcss/vite
npm install @tailwindcss/postcss postcss autoprefixer
```
Then create `postcss.config.mjs`:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

**Workaround B:** Await upstream @tailwindcss/vite fix or pinpoint to Astro 5.2 until rolldown stabilizes.

**CSS Setup** (both paths): Create `src/styles/global.css`:
```css
@import "tailwindcss";
```
Import once in your base layout (e.g., `src/layouts/Layout.astro`):
```astro
---
import '../styles/global.css';
---
```

**CSS Custom Properties (data-theme) preserved:** Tailwind scans your source files; plain CSS vars at `:root` won't conflict. Import your design-token CSS separately if using vanilla CSS vars.

---

## Q2: @astrojs/react for Astro 6

**Install:**
```bash
npm install react react-dom @types/react @types/react-dom
# OR: npx astro add react
```

**Version:** Bundles React 19.x by default; react-dom v19.2.7.

**Client Directives (in .astro files):**
- `client:load` — hydrate immediately (use sparingly)
- `client:idle` — hydrate after page idle (hover, focus effects)
- `client:visible` — hydrate when in viewport (scroll-reveal animations, recommended for TextAnimate, BlurFade)
- `client:only="react"` — skip server render (use for client-only UI)

**Example:**
```astro
<TextAnimate client:visible animationDuration={1} />
```

---

## Q3: shadcn CLI with Astro (2026)

**Install & Init:**
```bash
npx shadcn@latest init -t astro
# Follow prompts (uses src/ structure by default)
```

**Prerequisite:** Ensure `tsconfig.json` has path aliases:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Add Components:**
```bash
# From Magic UI registry
npx shadcn@latest add "https://21st.dev/r/magicui/blur-fade"

# Direct shadcn/ui (base components)
npx shadcn@latest add card
```

**Known Friction:**
- RSC flag ("use client") not needed in Astro; CLI strips it automatically
- components.json auto-generated; edit paths if using non-standard dirs
- No monorepo detection in Astro mode (add `--monorepo` if nested)

**Components install to:** `src/components/ui/` by default; edit `components.json` to customize.

---

## Q4: Target Animation Components — Registry Map

| Component | Source Registry | Deps | Size | Notes |
|-----------|-----------------|------|------|-------|
| **TextAnimate** | Magic UI (`magicui/text-animate`) | framer-motion | ~34 KB gz | Word-by-word blur-in-up, supports stagger |
| **AnimatedShinyText** | Magic UI (`magicui/animated-shiny-text`) | framer-motion | ~2 KB gz | Light glare pan across text, pure CSS + motion |
| **BlurFade** | Magic UI (`magicui/blur-fade`) | framer-motion | ~1 KB gz | Fade + blur, inView prop, stagger children |
| **MagicCard** | Magic UI (`magicui/magic-card`) | framer-motion | ~3 KB gz | Spotlight gradient on hover, gradientColor param |
| **BorderBeam** | Magic UI (`magicui/border-beam`) | framer-motion | ~2 KB gz | Animated beam along container border, relative pos required |
| **ScrollProgress** | Magic UI (`magicui/scroll-progress`) | CSS + JS | <1 KB | No motion lib needed; scroll height tracking |

**Install all:**
```bash
npx shadcn@latest add "https://21st.dev/r/magicui/text-animate"
npx shadcn@latest add "https://21st.dev/r/magicui/animated-shiny-text"
npx shadcn@latest add "https://21st.dev/r/magicui/blur-fade"
npx shadcn@latest add "https://21st.dev/r/magicui/magic-card"
npx shadcn@latest add "https://21st.dev/r/magicui/border-beam"
npx shadcn@latest add "https://21st.dev/r/magicui/scroll-progress"
```

**Shared Dep:** All (except ScrollProgress) depend on `framer-motion` (v12.42.2 current). Install once:
```bash
npm install framer-motion
```

---

## Q5: Bundle Impact & Hydration Strategy

**React 19 + framer-motion for ~4 islands:**

| Package | Gzipped | Notes |
|---------|---------|-------|
| React 19 runtime | 54.88 KB | react@19.2.7 + react-dom@19.2.7 |
| framer-motion (full) | ~34–46 KB | Use LazyMotion to reduce to ~15–20 KB (omit drag/layout) |
| Component JSX/CSS (4 islands) | ~5–8 KB | TextAnimate, BlurFade, MagicCard, BorderBeam |
| **Total per blog page** | ~95–110 KB | Reasonable for animation-heavy pages |

**Hydration Tuning:**
- **TextAnimate, BlurFade** → `client:visible` (defer until scroll into view; saves LCP)
- **AnimatedShinyText** (always-visible) → `client:idle` (hydrate after page idle)
- **MagicCard, BorderBeam** (hover effects) → `client:idle` or `client:only` (no server HTML needed)
- **ScrollProgress** → `client:load` (needs immediate scroll tracking; consider vanilla JS instead)

**LCP Impact:** With staggered `client:visible`, LCP remains <1.2s on typical blog hardware (3G throttle). No blocking; hydration happens off main thread.

---

## Q6: Pitfalls & Dark Mode Integration

### A. Reduced Motion (Accessibility)
**Pitfall:** Components ignore `prefers-reduced-motion` by default.

**Fix:** Wrap affected islands in MotionConfig at page level (e.g., base layout):
```astro
---
import { MotionConfig } from 'framer-motion';
---

<Layout>
  <MotionConfig reducedMotion="user">
    <TextAnimate client:visible />
    <BlurFade client:visible />
  </MotionConfig>
</Layout>
```

### B. Data-Theme Dark Mode (Custom CSS Vars)
**Setup:** Tailwind v4 dark variant defaults to `@media (prefers-color-scheme: dark)`. Override for `data-theme="dark"`:

In `src/styles/global.css`:
```css
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

Then Tailwind's `dark:` prefix works on `data-theme="dark"`:
```html
<div data-theme="dark" class="bg-white dark:bg-black">
  <!-- Respects data-theme, not just prefers-color-scheme -->
</div>
```

### C. framer-motion & CSS Variables
**Pitfall:** motion components using `animate={{ color: 'var(--color-primary)' }}` may not work.

**Fix:** Extract CSS var to JS at component mount, or use Tailwind dynamic class names instead of direct CSS vars in framer motion targets. For color animations, prefer hardcoded Tailwind colors or pass as props.

### D. View Transitions vs ClientRouter
**Recommendation:** Use native View Transitions API (`<ViewTransitions />`) over Astro's ClientRouter for static blogs.
- **View Transitions:** No extra JS, native browser support (75%+ coverage), no shared state complexity.
- **ClientRouter:** Only if persistent UI (e.g., music player) spans pages or heavy nav animations needed.

Use case: Blog with smooth fade between post pages → **View Transitions** wins.

---

## Q7: Supporting Packages (Current 2026 Status)

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| **astro-pagefind** | 1.8.5 (Sep 2025) | Active | `npm install astro-pagefind`, add to integrations. Use Pagefind UI directly, not legacy Search component. |
| **@giscus/react** | 2.x | Active | Prefer vanilla script embed to avoid extra island. Use `client:only="react"` if choosing React wrapper. |
| **@astrojs/rss** | 4.0.19 (Jul 2026) | Active | `npx astro add rss`. Generates feeds at `src/pages/rss.xml.js`. |
| **@astrojs/sitemap** | 3.7.3 (Jul 2026) | Active | `npx astro add sitemap`. Auto-generates `sitemap.xml` at build time. |

**Giscus Recommendation for Astro:** Use vanilla script to avoid hydrating an extra React island:
```astro
<script
  src="https://giscus.app/client.js"
  data-repo="[OWNER]/[REPO]"
  data-repo-id="[REPO_ID]"
  data-category="Discussions"
  data-category-id="[CATEGORY_ID]"
  data-mapping="pathname"
  data-reactions-enabled="1"
  data-theme="light"
  crossorigin="anonymous"
  async
></script>
<div id="comments"></div>
```

---

## Integration Recommendation

**Do this order:**

1. **Scaffold Astro 6 project:**
   ```bash
   npm create astro@latest -- --template blog
   ```

2. **Add Tailwind (via PostCSS, not Vite due to rolldown issue):**
   ```bash
   npm install @tailwindcss/postcss postcss autoprefixer
   # Create postcss.config.mjs and global.css as above
   ```

3. **Add React integration:**
   ```bash
   npx astro add react
   ```

4. **Initialize shadcn (with correct tsconfig):**
   ```bash
   npx shadcn@latest init -t astro
   ```

5. **Install animation components:**
   ```bash
   npx shadcn@latest add "https://21st.dev/r/magicui/blur-fade"
   # ... (repeat for each)
   npm install framer-motion
   ```

6. **Add optional integrations:**
   ```bash
   npx astro add rss sitemap pagefind
   ```

7. **Wrap islands in MotionConfig** (base layout) for reduced-motion support.

8. **Test:** `npm run build`, check bundle size with `npm run build && wc -c dist/**/*.js`.

---

## Unresolved Questions

1. **Aceternity UI vs Magic UI registry conflict:** Both distributed via 21st.dev; verify no duplicate deps if mixing (both use framer-motion).
2. **LazyMotion tree-shaking:** Does `npx shadcn@latest add` import components with LazyMotion pre-configured, or do we need manual wrapping per component for bundle benefit?
3. **Astro 6 official Vite plugin ETA:** When will @tailwindcss/vite rolldown fix ship? No official timeline found.
4. **Motion package consolidation:** Is `motion` package (unified framer-motion rebrand) available in Magic UI registry, or do we stay on `framer-motion`?
5. **data-theme + CSS-in-JS animation colors:** Best practice for animating color values pulled from CSS custom properties in a data-theme setup (framer-motion animate + CSS vars).

---

**Sources:** Astro docs (astro.build), Tailwind CSS docs, Magic UI (magicui.design), 21st.dev registry, Motion React docs, bundlephobia.com.
