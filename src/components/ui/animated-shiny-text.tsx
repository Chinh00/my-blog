import { type ComponentPropsWithoutRef, type FC } from "react"

import { cn } from "@/lib/utils"

export interface AnimatedShinyTextProps extends ComponentPropsWithoutRef<"span"> {}

/*
 * Bản gốc Magic UI dùng gradient đen/trắng + text màu bán trong suốt.
 * Đã thay bằng kỹ thuật shimmer của wireframe (design-guidelines §7.2):
 * gradient 100° accent-ink → shimmer-hi → accent-ink, chạy 2 lượt sau reveal
 * rồi dừng — khi nghỉ chữ là màu ink đặc (đạt AA). CSS ở global.css
 * (.fx-shimmer, gate @supports background-clip:text + html.fx).
 */
export const AnimatedShinyText: FC<AnimatedShinyTextProps> = ({
  children,
  className,
  ...props
}) => {
  return (
    <span className={cn("fx-shimmer accent", className)} {...props}>
      {children}
    </span>
  )
}
