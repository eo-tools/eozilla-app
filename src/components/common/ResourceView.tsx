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
  textProps = { ...styles.text.unavailable, size: "sm", ...textProps };
  loaderProps = { size: "sm", ...loaderProps };
  return (
    <>
      {typeof data !== "undefined" && children && children(data)}
      {error && (
        <Center>
          <Stack>
            {errorText && <Text {...textProps}>{errorText}</Text>}
            {
              <Text {...textProps} fw={200} c={"red"} size="xs">
                {getErrorMessage(error)}
              </Text>
            }
          </Stack>
        </Center>
      )}
      {typeof data === "undefined" &&
        !error &&
        !isLoading &&
        !isValidating &&
        nullText && (
          <Center py="sm">
            <Text {...textProps} fs="italic">
              {nullText}
            </Text>
          </Center>
        )}
      {isLoading && (
        <Center>
          <Stack>
            {loadingText && <Text {...textProps}>{loadingText}</Text>}
            <Loader {...loaderProps} />
          </Stack>
        </Center>
      )}
      {isValidating && validatingText && (
        <Center>
          <Text {...textProps}>{validatingText}</Text>
        </Center>
      )}
    </>
  );
}
