import { ActionIcon, Flex, Group, Stack, Text, Tooltip } from "@mantine/core";
import { IconDownload, IconEye } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { isLink, type JobResult } from "@/service";
import styles from "@/components/common/styles";

import { JobResultDetails } from "./JobResultDetails";
import { getOutputUrlError } from "./jobResultUtils";
import type { DialogId } from "@/state/types";

interface JobResultViewProps {
  outputName: string;
  outputIndex: number;
  jobResult: JobResult;
  openDialog: (dialogId: DialogId, dialogData?: unknown) => void;
}

export default function JobResultView({
  outputName,
  outputIndex,
  jobResult,
  openDialog,
}: JobResultViewProps) {
  return (
    <Stack w={"100%"} pb="sm">
      <Flex justify="space-between" align="flex-start" gap="sm">
        <Group>
          <Text size="sm">{`Result #${outputIndex + 1}`}</Text>
          <Text {...styles.text.id2} size="sm">
            {outputName}
          </Text>
        </Group>
        <ActionIcon.Group>
          <Tooltip label="View output" withArrow>
            <ActionIcon
              {...styles.actionIcon.sm}
              aria-label={`View output ${outputName}`}
              onClick={() =>
                openDialog("job-result", { outputName, jobResult })
              }
            >
              <IconEye {...styles.icon.sm} />
            </ActionIcon>
          </Tooltip>

          {isLink(jobResult) && (
            <Tooltip label="Download output" withArrow>
              <ActionIcon
                {...styles.actionIcon.sm}
                component="a"
                aria-label={`Download output ${outputName}`}
                href={getOutputUrlError(jobResult.href) ? "#" : jobResult.href}
                onClick={(event) => {
                  const error = getOutputUrlError(jobResult.href);
                  if (error) {
                    event.preventDefault();
                    notifications.show({ message: error, color: "red" });
                  }
                }}
                download
                target="_blank"
                rel="noreferrer"
              >
                <IconDownload {...styles.icon.sm} />
              </ActionIcon>
            </Tooltip>
          )}
        </ActionIcon.Group>
      </Flex>
      <JobResultDetails jobResult={jobResult} />
    </Stack>
  );
}
