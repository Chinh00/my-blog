import type { ReactNode } from "react";
import { MotionConfig } from "motion/react";

/**
 * Lớp phụ cho reduced-motion: MotionConfig reducedMotion="user" chỉ tắt
 * transform/layout (opacity/filter vẫn chạy) nên KHÔNG thay thế useFx() —
 * mỗi island vẫn tự check useFx() để render tĩnh khi reduce (§7.3).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
