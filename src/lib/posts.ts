import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"posts">;

/**
 * Điểm lọc DUY NHẤT cho bài draft — mọi nơi đọc collection (getStaticPaths,
 * listing, RSS, tag pages) phải đi qua đây. Draft không có route thì cũng
 * không lọt vào sitemap hay Pagefind index.
 * Kết quả đã sort pubDate giảm dần (bài mới nhất trước).
 */
export async function getPublishedPosts(): Promise<Post[]> {
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}
