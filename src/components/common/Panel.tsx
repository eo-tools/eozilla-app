import { type CSSProperties, type ReactNode } from "react";
import { Flex } from "@mantine/core";

import styles from "@/components/common/styles";
import { type PanelHeaderProps, PanelHeader } from "./PanelHeader";
import { type PanelSectionProps, PanelSection } from "./PanelSection";

export {
  type PanelHeaderProps,
  type PanelSectionProps,
  PanelHeader,
  PanelSection,
};

export interface PanelProps {
  children?: ReactNode;
  style?: CSSProperties;
  direction?: "column" | "row";
}

export const Panel = ({
  children,
  style,
  direction = "column",
}: PanelProps) => {
  const panelStyle: CSSProperties = {
    [direction === "column" ? "height" : "width"]: "100%",
    ...styles.panel.style,
    ...style,
  };
  return (
    <Flex
      px={styles.panel.px}
      pt={styles.panel.py}
      pb={0}
      gap={styles.panel.gap}
      direction={direction}
      style={panelStyle}
    >
      {children}
    </Flex>
  );
};

Panel.Header = PanelHeader;
Panel.Section = PanelSection;
