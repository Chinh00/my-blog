import { render } from "astro:content";
import type { Post } from "@/lib/posts";
import { slugify } from "@/lib/slugify";
import { formatDate, isoDate } from "@/lib/format-date";

/** Dữ liệu serializable truyền vào island PostListFx (props qua astro-island). */
export interface PostCardData {
  href: string;
  title: string;
  dateIso: string;
  dateLabel: string;
  minutes: number;
  excerpt: string;
  tags: { label: string; href: string }[];
}

export async function toPostCardData(posts: Post[]): Promise<PostCardData[]> {
  return Promise.all(
    posts.map(async (post) => {
      const { remarkPluginFrontmatter } = await render(post);
      return {
        href: `/bai-viet/${post.id}/`,
        title: post.data.title,
        dateIso: isoDate(post.data.pubDate),
        dateLabel: formatDate(post.data.pubDate),
        minutes: Number(remarkPluginFrontmatter.minutesRead ?? 1),
        excerpt: post.data.description,
        tags: post.data.tags.map((tag) => ({
          label: tag,
          href: `/chu-de/${slugify(tag)}/`,
        })),
      };
    }),
  );
}
