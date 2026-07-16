import rss from "@astrojs/rss";
import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { getPublishedPosts } from "@/lib/posts";
import { siteTitle, siteTagline, siteDescription } from "@/config";

/* html:true — bài mẫu dùng <cite> trong blockquote; mặc định (false) sẽ
   escape thành chữ thô trong email RSS-to-email. sanitize-html lọc ở dưới. */
const parser = new MarkdownIt({ html: true });

export async function GET(context) {
  const posts = await getPublishedPosts();
  return rss({
    title: `${siteTitle} — ${siteTagline}`,
    description: siteDescription,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/bai-viet/${post.id}/`,
      /* Full content — đầu vào cho Buttondown RSS-to-email: subscriber nhận
         nguyên bài, không chỉ excerpt. body là markdown thô (MDX ở đây thuần
         markdown, không JSX). */
      content: sanitizeHtml(parser.render(post.body ?? ""), {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
      }),
    })),
    customData: `<language>vi</language>`,
  });
}
