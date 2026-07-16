import type { ReactNode } from "react";
import { BlurFade } from "@/components/ui/blur-fade";
import { MotionProvider } from "@/components/effects/motion-provider";
import { useFx } from "@/components/effects/use-fx";

interface RevealFxProps {
  children: ReactNode;
  /** Trễ thêm (giây) — dùng cho stagger giữa các khối cùng lô. */
  delay?: number;
  className?: string;
}

/**
 * Scroll reveal (§7.2): opacity 0→1 + translateY 14px→0 khi vào viewport,
 * 1 lần. SSR/no-JS/reduced-motion: children hiển thị ngay (useFx).
 */
export function RevealFx({ children, delay = 0, className }: RevealFxProps) {
  const fx = useFx();
  if (!fx) return <div className={className}>{children}</div>;
  return (
    <MotionProvider>
      <BlurFade
        inView
        inViewMargin="-8% 0px -8% 0px"
        direction="up"
        offset={14}
        duration={0.7}
        delay={delay}
        blur="0px"
        className={className}
      >
        {children}
      </BlurFade>
    </MotionProvider>
  );
}
