# Vietnamese Personal Blog Design Research
**2026-07-15** | Reading-focused, warm, personal blog design direction

## Summary
Vietnamese text requires fonts with robust diacritic support and extra line-height headroom (1.5–1.6). Serif fonts dominate 2025–2026 long-form design; pair serif body with sans-serif headings. Adopt warm earthy palettes with off-white/dark-gray extremes (not pure white/black). Target 66-character line length (~700px width). Avoid AI-slop minimalism; favor authentic personal voice, generous white space, and warm typography.

---

## Direction 1: Warm Serif + Modern Sans (Professional Warmth)
**Fonts:** Lora (body 16–18px) + Be Vietnam Pro (headings 28–40px)
**Palette:**
- Light: bg #FAFAF8, text #1A1A1A, accent #D4845C (warm terracotta)
- Dark: bg #1A1A1A, text #F0EDE8, accent #E5C287 (golden warm)
**Mood:** Elegant, approachable, editorial. Suits reflective essays and knowledge pieces.

**Vietnamese support verified:** Lora via Google Fonts Latin+Vietnamese; Be Vietnam Pro designed specifically for Vietnamese diacritics. Both handle stacked combining marks correctly.

---

## Direction 2: Geometric Sans Duo (Clean, Contemporary)
**Fonts:** Be Vietnam Pro (body 16–18px, lowercase) + Space Grotesk (headings 32–48px, bold)
**Palette:**
- Light: bg #FFFFFF, text #2D2D2D, accent #8B5A8E (dusty plum)
- Dark: bg #0F0F0F, text #E8E8E8, accent #B8A89A (warm taupe)
**Mood:** Modern, technical yet personal. Works for dev logs, tech essays.

**Vietnamese support verified:** Both fonts support Vietnamese Latin subset via Google Fonts.

---

## Direction 3: Maximalist + Imperfection (Personal, Raw)
**Fonts:** Bricolage Grotesque (headings 40–56px, variable) + Lora (body 17–19px)
**Palette:**
- Light: bg #FFFEF7, text #1F1F1F, accent #C85A3A (burnt orange), secondary #6B9D8F (sage)
- Dark: bg #161514, text #F3F0EB, accent #D4845C (warm terracotta), secondary #7BA696 (soft sage)
**Mood:** Curated, personality-driven. Embraces visual texture and "imperfect" breaks in grid. Suit narrative essays, life reflections.

**Vietnamese support verified:** Bricolage Grotesque supports Vietnamese Latin-ext; Lora verified Latin+Vietnamese.

---

## Typography Details

**Body Text:**
- Size: 16–18px (17px recommended sweet spot for Vietnamese)
- Line height: 1.55–1.6 (Vietnamese needs extra headroom for diacritics)
- Line length: 60–75 characters (650–750px max-width; use `max-width: 66ch`)
- Letter spacing: +0.2px–+0.5px (improves diacritic clarity at body size)

**Headings:**
- H1: 36–48px, line-height 1.1
- H2: 28–36px, line-height 1.15
- H3: 24–28px, line-height 1.2
- Use sans-serif (Be Vietnam Pro, Space Grotesk, Bricolage) for contrast

**Key:** Vietnamese fonts need vertical headroom—lower ascender/descender heights with taller x-heights reduce diacritic collision risk.

---

## Layout Recommendations

**Homepage:**
- Centered masthead (name/tagline) in serif with ~60ch width
- Post list: grid or stacked cards, each ~700px wide
- Post preview: title (sans heading), date, excerpt (serif body), tag list

**Post Page:**
- Single column, centered, 700px max content width
- Sticky TOC (right sidebar on desktop, collapsible mobile) for long essays
- Header hierarchy: post title (48px sans), byline (14px muted), body (17px serif, 1.55 lh)
- Toc indent/styling: 12px left, highlight current section

**About Page:**
- Profile image + warm introduction paragraph (16px serif)
- Bio in columns if long (2 col desktop, 1 col mobile)

**Tag Pages:**
- Title + post count, then filter results by tag
- Same card layout as homepage

---

## 2025–2026 Trends: Adopt vs. Avoid

**ADOPT:**
- Serif for body text (long-form readability proven)
- Warm, earthy accent colors (comfort over corporate branding)
- White space & breathing room (anti-clutter)
- Variable font axes (geometric precision in headings)
- Hand-crafted or personal visual texture (grain, asymmetric spacing)
- System theme sync (light/dark mode respects OS preference)

**AVOID:**
- Pure white/pure black extremes (eye strain over time)
- High-saturation neon accents (fatiguing for long reading)
- Generic AI-generated layouts (common Webflow templates)
- Oversized hero images (dilutes long-form focus)
- Auto-play video, animations without user gesture (distraction)
- Thin fonts at body size (diacritic rendering breaks)

---

## Real Blog Inspiration

- **Jules Acree:** white space, category filters, warm minimalism
- **Riverside.fm Blog:** sticky TOC, distraction-free reading
- **Vietnamese Typography Showcase (visualgui.com, 2025):** uses Fern + Adapter; demonstrates modern serif+sans pairing for Vietnamese

---

## Unresolved Questions

1. Should favicon/logo use serif or sans? (Recommend: match primary heading font for cohesion)
2. Post metadata (date, read time) color/opacity? (Suggest: 60% opacity muted tone, not accent)
3. Image captions font size relative to body? (Recommend: 90% body size, 0.8 line-height, sans-serif)
4. Search/filter functionality required on homepage? (Yes, if 50+ posts planned; skip for MVP)
