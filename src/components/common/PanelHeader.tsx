import { type ReactNode } from "react";
import {
  Flex,
  Group,
  Stack,
  Text,
  type FlexProps,
  type TextProps,
} from "@mantine/core";

import { isString } from "@/utils/common";
import styles from "@/components/common/styles";

export interface PanelHeaderProps {
  children?: ReactNode;
  icon?: ReactNode;
  title: ReactNode;
  id?: ReactNode;
  idStyle?: keyof typeof styles.text;
  containerProps?: FlexProps;
}

export function PanelHeader({
  children,
  icon,
  title,
  id,
  idStyle,
  containerProps,
}: PanelHeaderProps) {
  return (
    <Flex direction="column" style={styles.panel.header.style}>
      <Flex
        direction="row"
        px={styles.panel.header.px}
        py={styles.panel.header.py}
        justify={"space-between"}
        align={"start"}
        {...containerProps}
      >
        <Flex
          direction="row"
          gap="sm"
          justify={"flex-start"}
          align={"flex-start"}
        >
          {icon}
          <Stack gap={0}>
            <Group gap="sm">
              {styleText(title, styles.panel.header.title)}
              {styleText(id, styles.text[idStyle || "id1"])}
            </Group>
          </Stack>
        </Flex>
        {children}
      </Flex>
    </Flex>
  );
}

function styleText(node: ReactNode, style: TextProps) {
  return isString(node) ? <Text {...style}>{node}</Text> : node;
}
