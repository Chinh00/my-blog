const formatter = new Intl.DateTimeFormat("vi-VN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  /* pubDate parse ở UTC — không set sẽ lệch ngày theo timezone máy build */
  timeZone: "UTC",
});

/** "15 tháng 6, 2026" — định dạng ngày chuẩn của blog (design-guidelines §2). */
export function formatDate(date: Date): string {
  return formatter.format(date);
}

/** Giá trị cho thuộc tính datetime của <time> — YYYY-MM-DD. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
