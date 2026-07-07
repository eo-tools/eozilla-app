import { Stack, Typography, Text, Group, Flex } from "@mantine/core";
import ReactMarkdown from "react-markdown";

import type { ProcessDescription } from "@/service";
import styles from "@/components/common/styles";

interface ProcessDescriptionViewProps {
  processDescription: ProcessDescription;
}

export default function ProcessDescriptionView({
  processDescription,
}: ProcessDescriptionViewProps) {
  const version = processDescription.version;
  const description = processDescription.description;
  return (
    <Stack>
      <Flex justify="space-between" align="center" gap="md">
        <Typography
          style={{
            flex: 1,
            fontSize: "var(--mantine-font-size-sm)",
            color: "var(--mantine-color-dimmed)",
          }}
        >
          {description ? (
            <ReactMarkdown>{description}</ReactMarkdown>
          ) : (
            <Text {...styles.text.unavailable}>
              No process description available.
            </Text>
          )}
        </Typography>

        <Group gap="xs" style={{ flexShrink: 0 }}>
          <Text fw={500} size="sm">
            Version:
          </Text>
          {version ? (
            <Text fw={200} size="sm">
              {version}
            </Text>
          ) : (
            <Text {...styles.text.unavailable} size="sm">
              Not available.
            </Text>
          )}
        </Group>
      </Flex>
    </Stack>
  );
}
