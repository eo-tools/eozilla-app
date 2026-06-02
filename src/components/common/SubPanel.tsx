import { type CSSProperties, type ReactNode } from "react";
import {
  Collapse,
  Flex,
  type FlexProps,
  Group,
  NavLink,
  Text,
} from "@mantine/core";

import styles from "@/components/common/styles";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";

export interface SubPanelProps {
  children?: ReactNode;
  style?: CSSProperties;
  title: ReactNode;
  icon?: ReactNode;
  opened?: boolean;
  onChange?: (value: boolean) => void;
  actions?: ReactNode;
  containerProps?: FlexProps;
}

export const SubPanel = ({
  children,
  style,
  title,
  icon,
  opened,
  onChange,
  actions,
  containerProps,
}: SubPanelProps) => {
  const panelStyle: CSSProperties = {
    ...styles.subPanel.style,
    ...style,
  };
  return (
    <Flex
      px={styles.subPanel.px}
      py={styles.subPanel.py}
      gap={styles.subPanel.gap}
      style={panelStyle}
      direction={"column"}
      {...containerProps}
    >
      <NavLink
        px={0}
        leftSection={
          <Group gap={4}>
            <div
              style={{
                width: "8px",
                height: "24px",
                backgroundColor: "var(--panel-header)",
                borderRadius: "var(--mantine-radius-md)",
                overflow: "hidden",
              }}
            />
            {icon}
          </Group>
        }
        rightSection={
          <Group gap={4}>
            {actions}
            {opened ? (
              <IconChevronUp {...styles.icon.md} />
            ) : (
              <IconChevronDown {...styles.icon.md} />
            )}
          </Group>
        }
        label={
          <Text fw={500} tt={"uppercase"} size={"sm"}>
            {title}
          </Text>
        }
        onClick={() => onChange && onChange(!opened)}
      />
      <Collapse expanded={!!opened}>{children}</Collapse>
    </Flex>
  );
};
