import { Flex, Stack, Text } from "@mantine/core";

import { useHoverReveal } from "@/components/common/useHoverReveal";
import HoverHelpIcon from "@/components/common/HoverHelpIcon";
import styles from "@/components/common/styles";

export interface IdLabelProps {
  id: string;
  title?: string;
  description?: string;
}

export default function IdLabel({ id, title, description }: IdLabelProps) {
  const { containerProps, revealStyle } = useHoverReveal();
  return (
    <Stack gap={0}>
      <Flex justify={"space-between"} align={"center"} {...containerProps}>
        <Text fw={200} size={"sm"}>
          {title}
        </Text>
        <HoverHelpIcon markdownText={description} revealStyle={revealStyle} />
      </Flex>
      <Text {...styles.text.id2} size={"xs"}>
        {id}
      </Text>
    </Stack>
  );
}
