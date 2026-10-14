import { Anchor, Flex, Group, Stack, Text } from "@mantine/core";
import { IconWindowMaximize } from "@tabler/icons-react";

import type { JobResult } from "@/service";
import styles from "@/components/common/styles";
import { JobResultDetails } from "./JobResultDetails";
import type { DialogId } from "@/state/types";

interface JobResultViewProps {
  outputName: string;
  jobResult: JobResult;
  openDialog: (dialogId: DialogId, dialogData?: unknown) => void;
}

export default function JobResultView({
  outputName,
  jobResult,
  openDialog,
}: JobResultViewProps) {
  return (
    <Stack w={"100%"} gap="xs" pb="md">
      <Flex justify="space-between" align="center" gap="xs" wrap="nowrap">
        <Text
          {...styles.text.id2}
          size="sm"
          truncate
          title={outputName}
          style={{ flex: 1, minWidth: 0 }}
        >
          {outputName}
        </Text>
        <Anchor
          component="button"
          type="button"
          size="xs"
          aria-label={`Open result ${outputName}`}
          onClick={() => openDialog("job-result", { outputName, jobResult })}
          style={{ flexShrink: 0 }}
        >
          <Group gap={4} wrap="nowrap">
            <IconWindowMaximize {...styles.icon.sm}  style={{ transform: "scaleX(-1)" }} aria-hidden /> Open result
          </Group>
        </Anchor>
      </Flex>
      <JobResultDetails jobResult={jobResult} />
    </Stack>
  );
}
