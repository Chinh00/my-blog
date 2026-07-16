import { toString } from 'mdast-util-to-string';

/* ~200 từ/phút — tiếng Việt đơn âm tiết, giữ hệ số mặc định (design-guidelines). */
const WORDS_PER_MINUTE = 200;

export function remarkReadingTime() {
  return (tree, { data }) => {
    const text = toString(tree);
    const words = text.split(/\s+/).filter(Boolean).length;
    data.astro.frontmatter.minutesRead = Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  };
}
