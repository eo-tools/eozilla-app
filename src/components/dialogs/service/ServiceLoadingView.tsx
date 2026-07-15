import { Center, Loader, Stack, Text } from "@mantine/core";

export interface ServiceLoadingViewProps {
  providerTitle?: string;
  hasOptions: boolean;
  isLoading: boolean;
}

export function ServiceLoadingView({
  providerTitle,
  hasOptions,
  isLoading,
}: ServiceLoadingViewProps) {
  return (
    <Center>
      <Stack align="center">
        <Text mt="xl">
          {isLoading
            ? "Connecting to the service..."
            : `Preparing ${providerTitle || "service"}...`}
        </Text>
        <Loader color="blue" />
        {providerTitle && hasOptions && (
          <Text c="dimmed" ta="center">
            Checking the service and your authentication session.
          </Text>
        )}
      </Stack>
    </Center>
  );
}
