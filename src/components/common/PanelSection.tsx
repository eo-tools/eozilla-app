import { type CSSProperties, type ReactNode } from "react";
import { Flex, ScrollArea } from "@mantine/core";
import styles from "@/components/common/styles";

export interface PanelSectionProps {
  children?: ReactNode;
  style?: CSSProperties;
  scroll?: boolean;
  grow?: boolean;
}

export function PanelSection({
  children,
  style,
  scroll,
  grow,
}: PanelSectionProps) {
  const Container = scroll ? ScrollArea : Flex;
  style = {
    flexGrow: grow ? 1 : 0,
    overflow: grow ? "hidden" : undefined,
    ...style,
  };
  return (
    <Container
      mx={scroll ? "calc(var(--mantine-spacing-xs) * -1)" : undefined}
      px={styles.panel.section.px}
      py={styles.panel.section.py}
      viewportProps={
        scroll
          ? { style: { paddingInline: "var(--mantine-spacing-md" } }
          : undefined
      }
      style={style}
    >
      {children}
    </Container>
  );
}
