import { Button, Group, Stack, Text } from "@mantine/core";

export interface ServiceErrorViewProps {
  providerTitle?: string;
  message: string;
  onBack: () => void;
  onChooseAnother: () => void;
}

export function ServiceErrorView({
  providerTitle,
  message,
  onBack,
  onChooseAnother,
}: ServiceErrorViewProps) {
  return (
    <Stack gap="xs">
      <Text fw={600}>
        {providerTitle
          ? `Failed to sign in with ${providerTitle}`
          : "Failed to sign in"}
      </Text>
      <Text c="red">{message}</Text>
      <Group>
        <Button onClick={onBack}>Back</Button>
        <Button onClick={onChooseAnother} variant="default">
          Choose another service
        </Button>
      </Group>
    </Stack>
  );
}
