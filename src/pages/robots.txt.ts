import type { APIRoute } from "astro";

/* Route động thay vì file tĩnh trong public/ để dòng Sitemap luôn
   theo siteUrl trong src/config.ts — một nguồn URL duy nhất. */
export const GET: APIRoute = ({ site }) => {
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${new URL("sitemap-index.xml", site).href}`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
