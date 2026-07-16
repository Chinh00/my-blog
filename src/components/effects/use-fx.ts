import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Gate hiệu ứng 2 lớp cho island (design-guidelines §7.3, red-team):
 * 1. Chỉ bật SAU hydration (mounted) → SSR output luôn hiển thị mặc định,
 *    không opacity:0 mồ côi khi no-JS / hydration fail.
 * 2. Tôn trọng prefers-reduced-motion (useReducedMotion) + gate html.fx
 *    (script <head> chỉ thêm .fx khi không reduced-motion).
 */
export function useFx(): boolean {
  const [mounted, setMounted] = useState(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => setMounted(true), []);
  return (
    mounted &&
    !reducedMotion &&
    document.documentElement.classList.contains("fx")
  );
}
