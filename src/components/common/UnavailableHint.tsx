import { Text, Center, type TextProps } from "@mantine/core";

import styles from "@/components/common/styles";

export interface UnavailableHintProps {
  message?: string;
  textProps?: TextProps;
}

export function UnavailableHint({ message, textProps }: UnavailableHintProps) {
  textProps = { ...styles.text.unavailable, ...textProps };
  return (
    message && (
      <Center>
        <Text {...textProps}>{message}</Text>
      </Center>
    )
  );
}
