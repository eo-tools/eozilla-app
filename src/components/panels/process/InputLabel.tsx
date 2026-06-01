import { Flex, Stack, Text } from "@mantine/core";

import type { InputDescription } from "@/service";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import HoverHelpIcon from "@/components/common/HoverHelpIcon";
import styles from "@/components/common/styles";

export interface InputLabelProps {
  inputName: string;
  inputDescription: InputDescription;
}

export default function InputLabel({
  inputName,
  inputDescription,
}: InputLabelProps) {
  const { containerProps, revealStyle } = useHoverReveal();
  return (
    <Stack gap={0}>
      <Flex justify={"space-between"} align={"center"} {...containerProps}>
        <Text {...styles.text.id2} size={"sm"}>
          {inputName}
        </Text>
        <HoverHelpIcon
          markdownText={inputDescription.description}
          revealStyle={revealStyle}
        />
      </Flex>
      <Text fw={200} size={"xs"}>
        {inputDescription!.title}
      </Text>
    </Stack>
  );
}
