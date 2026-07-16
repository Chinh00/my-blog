// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';
import { unified } from '@astrojs/markdown-remark';

import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { siteUrl } from './src/config.ts';

if (siteUrl.includes('example.com')) {
  console.warn(
    '\n⚠️  siteUrl vẫn là placeholder example.com — canonical/OG/RSS/sitemap sẽ trỏ sai.' +
      '\n   Sửa `siteUrl` trong src/config.ts trước khi deploy.\n',
  );
}

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  integrations: [react(), mdx(), sitemap(), pagefind()],
  markdown: {
    /* API Astro 6: remarkPlugins trực tiếp đã deprecated → truyền qua processor */
    processor: unified({ remarkPlugins: [remarkReadingTime] }),
    /* Code block theo wireframe: nền --surface, chữ mono đơn sắc — không theme
       Shiki (inline style của Shiki đè CSS tokens và lệch cả 2 theme). */
    syntaxHighlight: false,
  },
});