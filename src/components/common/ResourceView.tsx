import { type ReactNode } from "react";
import {
  Text,
  Loader,
  Center,
  Stack,
  type LoaderProps,
  type TextProps,
} from "@mantine/core";

import { getErrorMessage } from "@/utils/common";
import styles from "@/components/common/styles";
import { UnavailableHint } from "@/components/common/UnavailableHint";

export interface ResourceViewProps<T> {
  data?: T | undefined;
  error?: unknown;
  isLoading?: boolean;
  isValidating?: boolean;
  children?: (data: T) => ReactNode;
  nullText?: string;
  loadingText?: string;
  validatingText?: string;
  errorText?: string;
  textProps?: TextProps;
  loaderProps?: LoaderProps;
}

export function ResourceView<T>({
  data,
  error,
  isLoading,
  isValidating,
  errorText,
  nullText,
  loadingText,
  validatingText,
  textProps,
  loaderProps,
  children,
}: ResourceViewProps<T>) {
  return (
    <>
      {typeof data !== "undefined" && children && children(data)}
      {error && (
        <Center>
          <Stack>
            <UnavailableHint textProps={textProps} message={errorText} />
            <Text
              {...styles.text.unavailable}
              fw={200}
              c="red"
              size="xs"
              {...textProps}
            >
              {getErrorMessage(error)}
            </Text>
          </Stack>
        </Center>
      )}
      {typeof data === "undefined" && !error && !isLoading && !isValidating && (
        <UnavailableHint textProps={textProps} message={nullText} />
      )}
      {isLoading && (
        <Center>
          <Stack>
            {loadingText && (
              <Text {...styles.text.unavailable} {...textProps}>
                {loadingText}
              </Text>
            )}
            <Loader size="sm" {...loaderProps} />
          </Stack>
        </Center>
      )}
      {isValidating && (
        <UnavailableHint textProps={textProps} message={validatingText} />
      )}
    </>
  );
}
