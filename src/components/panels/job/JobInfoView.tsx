import { ActionIcon, Progress, Stack, Table } from "@mantine/core";
import { IconCopy, IconEye } from "@tabler/icons-react";

import type { JobInfo } from "@/service";
import { isNumber, isString, type Optional } from "@/utils/common";
import styles from "@/components/common/styles";

interface JobInfoViewProps {
  jobInfo: JobInfo;
  viewTraceback: (traceback: string) => void;
  copyTraceback: (traceback: string) => void;
}

export default function JobInfoView({
  jobInfo,
  viewTraceback,
  copyTraceback,
}: JobInfoViewProps) {
  const traceback = normalizeTraceback(jobInfo["x-traceback"]);
  return (
    <Stack w={"100%"} pb="sm">
      <Table
        variant="vertical"
        layout="fixed"
        verticalSpacing={2}
        withTableBorder
        withRowBorders
        fw={200}
        fz="xs"
      >
        <Table.Tbody>
          <Table.Tr>
            <Table.Th w={80}>Process ID:</Table.Th>
            <Table.Td>{jobInfo.processID}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th w={80}>Status:</Table.Th>
            <Table.Td>{jobInfo.status}</Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th>Progress:</Table.Th>
            <Table.Td>
              {isNumber(jobInfo.progress) ? (
                <Progress.Root size={"lg"} w={120}>
                  <Progress.Section value={jobInfo.progress} color="orange">
                    <Progress.Label>{jobInfo.progress} %</Progress.Label>
                  </Progress.Section>
                </Progress.Root>
              ) : (
                "-"
              )}
            </Table.Td>
          </Table.Tr>

          <Table.Tr>
            <Table.Th>Message:</Table.Th>
            <Table.Td>{jobInfo.message || "-"}</Table.Td>
          </Table.Tr>

          {traceback && (
            <Table.Tr>
              <Table.Th>Traceback:</Table.Th>
              <Table.Td>
                <ActionIcon.Group>
                  <ActionIcon
                    {...styles.actionIcon.sm}
                    onClick={() => void viewTraceback(traceback)}
                  >
                    <IconEye {...styles.icon.sm} />
                  </ActionIcon>
                  <ActionIcon
                    {...styles.actionIcon.sm}
                    onClick={() => void copyTraceback(traceback)}
                  >
                    <IconCopy {...styles.icon.sm} />
                  </ActionIcon>
                </ActionIcon.Group>
              </Table.Td>
            </Table.Tr>
          )}

          <Table.Tr>
            <Table.Th>Created:</Table.Th>
            <Table.Td>{sanitizeUtc(jobInfo.created)}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Started:</Table.Th>
            <Table.Td>{sanitizeUtc(jobInfo.started)}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Updated:</Table.Th>
            <Table.Td>{sanitizeUtc(jobInfo.updated)}</Table.Td>
          </Table.Tr>
          <Table.Tr>
            <Table.Th>Finished:</Table.Th>
            <Table.Td>{sanitizeUtc(jobInfo.finished)}</Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Stack>
  );
}

function sanitizeUtc(dateTime: Optional<string>) {
  if (!dateTime) {
    return "-";
  }
  const index = dateTime.indexOf(".");
  if (index > 0) {
    return dateTime.substring(0, index + 2).replace("T", " ");
  }
  return dateTime.replace("T", " ").replace("Z", "");
}

function normalizeTraceback(traceback: Optional<string | string[]>) {
  if (isString(traceback)) {
    return traceback;
  } else if (Array.isArray(traceback)) {
    return traceback.join("\n");
  }
}
