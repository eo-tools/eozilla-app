import type { ReactNode } from "react";
import { Accordion, Flex, Text } from "@mantine/core";

import styles from "@/components/common/styles";

export interface SubPanelItemProps {
  children?: ReactNode;
  value: string;
  title: string;
  actions?: ReactNode;
  keepMounted?: boolean;
}

export function SubPanelItem({
  children,
  value,
  title,
  actions,
  keepMounted,
}: SubPanelItemProps) {
  const titleText = <Text {...styles.text.title2}>{title}</Text>;
  return (
    <Accordion.Item value={value}>
      {!actions ? (
        <Accordion.Control>{titleText}</Accordion.Control>
      ) : (
        <Flex align={"center"} gap={"xs"}>
          <Accordion.Control style={{ flex: 1 }}>{titleText}</Accordion.Control>
          <Flex align={"center"}>{actions}</Flex>
        </Flex>
      )}
      <Accordion.Panel keepMounted={keepMounted}>{children}</Accordion.Panel>
    </Accordion.Item>
  );
}
