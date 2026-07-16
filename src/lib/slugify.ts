/**
 * Chuyển tag tiếng Việt có dấu thành slug URL không dấu.
 * Dùng cho CẢ route lẫn link — một nguồn duy nhất để không lệch nhau.
 * Ví dụ: "cuộc sống" → "cuoc-song", "sự nghiệp" → "su-nghiep".
 */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
