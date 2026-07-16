import { TextAnimate } from "@/components/ui/text-animate";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { MotionProvider } from "@/components/effects/motion-provider";
import { useFx } from "@/components/effects/use-fx";

interface MastheadRevealProps {
  /** Phần chữ reveal từng từ, ví dụ "Xin chào, mình là". */
  leading: string;
  /** Từ có shimmer, ví dụ "Chính." */
  shiny: string;
}

/**
 * Masthead reveal (§7.2): từng từ blur+fade+translateY, stagger ~90ms;
 * chữ shiny chạy shimmer 2 lượt (CSS .fx-shimmer). Trước hydration /
 * khi reduced-motion: render tĩnh đầy đủ.
 */
export function MastheadReveal({ leading, shiny }: MastheadRevealProps) {
  const fx = useFx();

  return (
    <MotionProvider>
      <h1 aria-label={`${leading} ${shiny}`}>
        {fx ? (
          <TextAnimate
            as="span"
            by="word"
            animation="blurInUp"
            duration={0.65}
            startOnView={false}
            once
            accessible={false}
            aria-hidden="true"
          >
            {leading}
          </TextAnimate>
        ) : (
          <span aria-hidden="true">{leading}</span>
        )}{" "}
        <AnimatedShinyText aria-hidden="true">{shiny}</AnimatedShinyText>
      </h1>
    </MotionProvider>
  );
}
