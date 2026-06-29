import type { ReactNode } from "react";
import { Flex, Stack, Text } from "@mantine/core";

import HoverHelpIcon from "@/components/common/HoverHelpIcon";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import styles from "@/components/common/styles";
import type { Field } from "@/utils/field";
import { getFieldDescription, getFieldLabel } from "./fieldUtils";

interface FieldShellProps {
  field: Field;
  children: ReactNode;
  hideLabel?: boolean;
}

export function FieldShell({ field, children, hideLabel }: FieldShellProps) {
  const { containerProps, revealStyle } = useHoverReveal();
  const description = getFieldDescription(field);

  if (hideLabel) {
    return <>{children}</>;
  }

  return (
    <Stack gap={4}>
      <Flex justify="space-between" align="center" {...containerProps}>
        <Text {...styles.text.id2} size="sm">
          {getFieldLabel(field)}
        </Text>
        <HoverHelpIcon markdownText={description} revealStyle={revealStyle} />
      </Flex>
      {children}
    </Stack>
  );
}
