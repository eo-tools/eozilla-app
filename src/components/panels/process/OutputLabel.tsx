import { Flex, Stack, Text } from "@mantine/core";

import type { OutputDescription } from "@/service";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import HoverHelpIcon from "@/components/common/HoverHelpIcon";
import styles from "@/components/common/styles";

export interface OutputLabelProps {
  outputName: string;
  outputDescription: OutputDescription;
}

export default function OutputLabel({
  outputName,
  outputDescription,
}: OutputLabelProps) {
  const { containerProps, revealStyle } = useHoverReveal();
  return (
    <Stack gap={0}>
      <Flex justify={"space-between"} align={"center"} {...containerProps}>
        <Text {...styles.text.id2} size={"sm"}>
          {outputName}
        </Text>
        <HoverHelpIcon
          markdownText={outputDescription.description}
          revealStyle={revealStyle}
        />
      </Flex>
      <Text fw={200} size={"xs"}>
        {outputDescription.title}
      </Text>
    </Stack>
  );
}
