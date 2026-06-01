import type { CSSProperties } from "react";
import { useHover } from "@mantine/hooks";

export function useHoverReveal(
  duration = 200,
  minOpacity = 0.05,
  maxOpacity = 1.0,
) {
  const { hovered, ref } = useHover();

  const containerProps = { ref };

  const revealStyle: CSSProperties = {
    opacity: hovered ? maxOpacity : minOpacity,
    transition: `opacity ${duration}ms ease`,
  };

  return { containerProps, revealStyle };
}
