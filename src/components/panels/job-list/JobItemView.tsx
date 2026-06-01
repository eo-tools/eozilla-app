import {
  ActionIcon,
  Flex,
  NavLink,
  Progress,
  Stack,
  Text,
} from "@mantine/core";

import type { JobInfo } from "@/service";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import { isNumber, isString, type Optional } from "@/utils/common";
import { IconCancel, IconTrash } from "@tabler/icons-react";
import styles from "@/components/common/styles";
import { JobStatusIcon } from "./JobStatusIcon";

export interface JobItemViewProps {
  jobInfo: JobInfo;
  activeJobId?: string;
  activateJob: (jobId: Optional<string>) => void;
  dismissJob: (jobId: string) => void;
}

export function JobItemView({
  jobInfo,
  activeJobId,
  activateJob,
  dismissJob,
}: JobItemViewProps) {
  const {
    jobID: jobId,
    processID: processId,
    status,
    message,
    progress,
  } = jobInfo;
  const { containerProps, revealStyle } = useHoverReveal();
  const canDismiss = true;
  const isActive = jobId === activeJobId;
  const DismissIcon =
    status === "accepted" || status === "running" ? IconCancel : IconTrash;
  return (
    <NavLink
      px={styles.list.item.px}
      py={styles.list.item.py}
      onClick={() => {
        activateJob(activeJobId !== jobId ? jobId : null);
      }}
      active={isActive}
      // variant={isActive ? "filled" : "default"}
      label={
        <Flex gap={"xs"} wrap={"nowrap"}>
          <JobStatusIcon status={status} />
          <Stack flex={1} gap={2}>
            <Flex
              direction={"row"}
              w={"100%"}
              justify={"space-between"}
              align={"center"}
              {...containerProps}
            >
              <Text size="sm">
                <Text component="span" {...styles.text.id1}>
                  {processId}
                </Text>
                {" / "}
                <Text component="span" {...styles.text.id3}>
                  {jobId}
                </Text>
              </Text>
              <ActionIcon.Group style={revealStyle}>
                <ActionIcon
                  {...styles.actionIcon.sm}
                  disabled={!canDismiss}
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissJob(jobId);
                  }}
                >
                  <DismissIcon {...styles.icon.sm} />
                </ActionIcon>
              </ActionIcon.Group>
            </Flex>
            {status === "running" && isString(message) && (
              <Text c="dimmed" size={"xs"}>
                {message}
              </Text>
            )}
            {status === "running" && isNumber(progress) && (
              <Progress value={progress} size={"sm"} />
            )}
          </Stack>
        </Flex>
      }
    />
  );
}
