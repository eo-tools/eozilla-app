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
import { IconCancel, IconRefresh, IconTrash } from "@tabler/icons-react";
import { Tooltip } from "@mantine/core";
import styles from "@/components/common/styles";
import { JobStatusIcon } from "./JobStatusIcon";

export interface JobItemViewProps {
  jobInfo: JobInfo;
  activeJobId?: string;
  activateJob: (jobId: Optional<string>) => void;
  dismissJob: (jobId: string) => void;
  restartJob: (jobInfo: JobInfo) => void;
}

export function JobItemView({
  jobInfo,
  activeJobId,
  activateJob,
  dismissJob,
  restartJob,
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
  const canRestart = status === "failed" || status === "dismissed";
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
      variant={isActive ? "light" : "default"}
      className="list-row"
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
                {canRestart && (
                  <Tooltip label="Restart job">
                    <ActionIcon
                      {...styles.actionIcon.sm}
                      aria-label="Restart job"
                      onClick={(e) => {
                        e.stopPropagation();
                        restartJob(jobInfo);
                      }}
                    >
                      <IconRefresh {...styles.icon.sm} />
                    </ActionIcon>
                  </Tooltip>
                )}
                <Tooltip
                  label={
                    status === "accepted" || status === "running"
                      ? "Cancel job"
                      : "Delete job"
                  }
                >
                  <ActionIcon
                    {...styles.actionIcon.sm}
                    aria-label={
                      status === "accepted" || status === "running"
                        ? "Cancel job"
                        : "Delete job"
                    }
                    disabled={!canDismiss}
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissJob(jobId);
                    }}
                  >
                    <DismissIcon {...styles.icon.sm} />
                  </ActionIcon>
                </Tooltip>
              </ActionIcon.Group>
            </Flex>
            {status === "running" && isString(message) && (
              <Text size={"xs"}>{message}</Text>
            )}
            {status === "running" && isNumber(progress) && (
              <Progress value={progress} size={"sm"} color="teal" />
            )}
          </Stack>
        </Flex>
      }
    />
  );
}
