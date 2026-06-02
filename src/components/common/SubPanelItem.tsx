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
  const control = !actions ? (
    titleText
  ) : (
    <Flex justify={"space-between"} align={"flex-start"}>
      <Text {...styles.text.title2}>{title}</Text>
      {actions}
    </Flex>
  );
  return (
    <Accordion.Item value={value}>
      <Accordion.Control>{control}</Accordion.Control>
      <Accordion.Panel keepMounted={keepMounted}>{children}</Accordion.Panel>
    </Accordion.Item>
  );
}
