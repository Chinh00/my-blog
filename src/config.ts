/**
 * Cấu hình trung tâm — nơi DUY NHẤT cần sửa khi onboarding.
 * `siteUrl` là nguồn URL duy nhất của toàn site: astro.config.mjs import từ đây,
 * mọi chỗ khác dùng Astro.site / import.meta.env.SITE — không hardcode URL thứ hai.
 */

export const siteUrl = "https://blog.phopoint.io.vn";

export const siteTitle = "Chinh.";
export const siteTagline = "Chia sẻ kinh nghiệm, kiến thức và cuộc sống";
export const siteDescription =
  "Blog cá nhân của Chinh — nơi chia sẻ kinh nghiệm làm việc, kiến thức và những lát cắt cuộc sống.";
export const author = "Chinh";

/**
 * Giscus (bình luận qua GitHub Discussions) — repoId/categoryId KHÔNG phải
 * secret (hiển thị công khai trong HTML theo thiết kế của Giscus).
 * TODO(onboarding): tạo repo public + bật Discussions, lấy giá trị tại
 * https://giscus.app rồi điền vào đây. null → hiện placeholder lịch sự.
 */
export interface GiscusConfig {
  repo: `${string}/${string}`;
  repoId: string;
  category: string;
  categoryId: string;
}
export const giscus: GiscusConfig | null = {
  repo: "Chinh00/my-blog",
  repoId: "R_kgDOTad8ig",
  category: "Announcements",
  categoryId: "DIC_kwDOTad8is4DBXVf",
};

/**
 * TODO(onboarding): username Buttondown (buttondown.com) — điền để form
 * đăng ký hoạt động. null → form disabled + ghi chú. RSS-to-email cấu hình
 * trên dashboard Buttondown trỏ vào /rss.xml (xem README).
 */
export const buttondownUsername: string | null = null;
