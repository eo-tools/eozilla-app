import { Flex, NavLink, Stack, Text } from "@mantine/core";

import type { ProcessSummary } from "@/service";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import HoverHelpIcon from "@/components/common/HoverHelpIcon";
import styles from "@/components/common/styles";

interface ProcessSummaryViewProps {
  process: ProcessSummary;
  activeProcessId?: string;
  activateProcess: (processId: string) => void;
}

export default function ProcessItemView({
  process,
  activeProcessId,
  activateProcess,
}: ProcessSummaryViewProps) {
  const { containerProps, revealStyle } = useHoverReveal();
  const isActive = process.id === activeProcessId;
  return (
    <NavLink
      px={styles.list.item.px}
      py={styles.list.item.py}
      onClick={() => activateProcess(process.id)}
      active={isActive}
      variant={isActive ? "filled" : "default"}
      label={
        <Stack m={0} p={0} gap={2}>
          <Flex justify={"space-between"} align={"center"} {...containerProps}>
            <Text {...styles.text.id1} size={"sm"}>
              {process.title}
            </Text>
            <HoverHelpIcon
              markdownText={process.description}
              revealStyle={revealStyle}
            />
          </Flex>
          <Text fw={200} size={"sm"}>
            {process.id}
          </Text>
        </Stack>
      }
    />
  );
}
