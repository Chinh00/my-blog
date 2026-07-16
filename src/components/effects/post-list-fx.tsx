import { useState } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { MotionProvider } from "@/components/effects/motion-provider";
import { useFx } from "@/components/effects/use-fx";
import type { PostCardData } from "@/lib/post-card-data";

/* Nội dung card — markup đồng nhất giữa bản tĩnh và bản hiệu ứng. */
function CardBody({ post }: { post: PostCardData }) {
  return (
    <>
      <p className="post-meta">
        <time dateTime={post.dateIso}>{post.dateLabel}</time> · {post.minutes}{" "}
        phút đọc
      </p>
      <h3>
        <a href={post.href}>{post.title}</a>
      </h3>
      <p className="excerpt">{post.excerpt}</p>
      <ul className="tag-list">
        {post.tags.map((tag) => (
          <li key={tag.href}>
            <a className="tag" href={tag.href}>
              {tag.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function PostCardFx({ post, delay }: { post: PostCardData; delay: number }) {
  const fx = useFx();
  /* BorderBeam animate vô hạn — chỉ mount khi hover để không tốn main-thread
     lúc ẩn (code review 2026-07-16, finding #4) */
  const [hovered, setHovered] = useState(false);

  if (!fx) {
    return (
      <li>
        <article className="post-card">
          <CardBody post={post} />
        </article>
      </li>
    );
  }

  return (
    <li
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      <BlurFade
        inView
        inViewMargin="-8% 0px -8% 0px"
        direction="up"
        offset={14}
        duration={0.7}
        delay={delay}
        blur="0px"
      >
        {/* Spotlight + ring bám chuột: màu đọc từ CSS variables §1 (không hardcode) */}
        <MagicCard
          className="fx-card"
          gradientSize={200}
          gradientColor="color-mix(in srgb, var(--accent) 11%, transparent)"
          gradientOpacity={1}
          gradientFrom="var(--accent)"
          gradientTo="color-mix(in srgb, var(--accent) 40%, var(--border))"
        >
          <article className="post-card post-card--fx">
            <CardBody post={post} />
          </article>
          {/* Beam chạy quanh viền — mount khi hover, fade-in qua group-hover */}
          {hovered && (
            <BorderBeam
              size={56}
              duration={5}
              colorFrom="var(--accent)"
              colorTo="color-mix(in srgb, var(--accent) 20%, transparent)"
              className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
          )}
        </MagicCard>
      </BlurFade>
    </li>
  );
}

/**
 * Danh sách bài với đủ 3 hiệu ứng card (§7.2): scroll reveal (BlurFade),
 * spotlight + ring (MagicCard), border beam khi hover (BorderBeam).
 * SSR/no-JS/reduced-motion: render <ul> card tĩnh y hệt bản Astro.
 */
export function PostListFx({ posts }: { posts: PostCardData[] }) {
  return (
    <MotionProvider>
      <ul className="post-list">
        {posts.map((post, i) => (
          <PostCardFx
            key={post.href}
            post={post}
            delay={Math.min(i, 3) * 0.09}
          />
        ))}
      </ul>
    </MotionProvider>
  );
}
