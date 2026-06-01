import {
  Badge,
  Button,
  Code,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import styles from "@/components/common/styles";
import type { Service } from "@/service";
import { isObject } from "@/utils/common";

export interface ServiceSignedInViewProps {
  service: Service;
  onContinue: () => void;
  onSignOut: () => void;
}

export function ServiceSignedInView({
  service,
  onContinue,
  onSignOut,
}: ServiceSignedInViewProps) {
  return (
    <Stack h="100%" w="100%" justify="space-between" gap="md">
      <Stack gap="md">
        <Paper withBorder radius="md" p="md">
          <Stack gap="xs">
            <Text size="sm" fw={700} tt="uppercase" c="dimmed">
              Server
            </Text>
            <Title order={4}>{service.root.title || service.providerId}</Title>
            {service.root.description ? (
              <Text size="sm" c="dimmed">
                {service.root.description}
              </Text>
            ) : (
              <Text size="sm" c="dimmed">
                No server description available.
              </Text>
            )}

            <Stack gap={4} mt="xs">
              <Text size="sm" fw={600}>
                Capabilities
              </Text>
              {renderCapabilities(service.root.capabilities)}
            </Stack>
          </Stack>
        </Paper>

        <Text>{`Hello ${service.user.displayName || service.user.email}!`}</Text>
        <Text>
          <Text component="span">
            {"You have been successfully signed into the "}
          </Text>
          <Text component="span" {...styles.text.id3}>
            {service.providerId}
          </Text>
          <Text component="span">{" service."}</Text>
        </Text>
      </Stack>

      <Group justify="flex-end" w="100%">
        <Button onClick={onSignOut} variant="default">
          Sign out
        </Button>
        <Button onClick={onContinue}>Done</Button>
      </Group>
    </Stack>
  );
}

function renderCapabilities(capabilities: unknown) {
  if (Array.isArray(capabilities) && capabilities.length > 0) {
    return (
      <Group gap="xs">
        {capabilities.map((capability) => (
          <Badge key={capabilityLabel(capability)} variant="light">
            {capabilityLabel(capability)}
          </Badge>
        ))}
      </Group>
    );
  }

  if (isObject(capabilities) && Object.keys(capabilities).length > 0) {
    return <Code block>{JSON.stringify(capabilities, null, 2)}</Code>;
  }

  if (typeof capabilities === "string" && capabilities.trim()) {
    return <Text>{capabilities}</Text>;
  }

  return (
    <Text size="sm" c="dimmed">
      No capabilities declared.
    </Text>
  );
}

function capabilityLabel(capability: unknown): string {
  if (typeof capability === "string") {
    return capability;
  }
  if (typeof capability === "number" || typeof capability === "boolean") {
    return String(capability);
  }
  if (isObject(capability)) {
    return JSON.stringify(capability);
  }
  return "unknown";
}
