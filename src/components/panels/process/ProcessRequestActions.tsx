import { useRef, type ChangeEvent } from "react";
import { ActionIcon, Box, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconDownload,
  IconPlayerPlayFilled,
  IconUpload,
} from "@tabler/icons-react";

import type { ProcessDescription, ProcessRequest } from "@/service";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import styles from "@/components/common/styles";
import { getErrorMessage } from "@/utils/common";
import {
  parseProcessRequestJson,
  stringifyProcessRequestJson,
} from "@/utils/processRequestFile";

interface ProcessRequestActionsProps {
  processId?: string;
  processDescription?: ProcessDescription;
  currentProcessRequest?: ProcessRequest;
  isSubmitting: boolean;
  canExecute: boolean;
  onExecute: () => void;
  setProcessRequest: (processId: string, processRequest: ProcessRequest) => void;
}

export default function ProcessRequestActions({
  processId,
  processDescription,
  currentProcessRequest,
  isSubmitting,
  canExecute,
  onExecute,
  setProcessRequest,
}: ProcessRequestActionsProps) {
  const requestFileInputRef = useRef<HTMLInputElement>(null);
  const { containerProps, revealStyle } = useHoverReveal(200, 0.05, 1);

  const handleImportClick = () => {
    requestFileInputRef.current?.click();
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file || !processId) {
      return;
    }

    try {
      if (!processDescription) {
        throw new Error("No process selected.");
      }
      const processRequest = parseProcessRequestJson(
        await file.text(),
        processDescription,
      );
      setProcessRequest(processId, processRequest);
      notifications.show({ message: "Process request imported." });
    } catch (error) {
      notifications.show({
        message: `Failed to import process request: ${getErrorMessage(error)}`,
        color: "red",
      });
    }
  };

  const handleExportClick = () => {
    if (!processId || !currentProcessRequest) {
      return;
    }

    const blob = new Blob([stringifyProcessRequestJson(currentProcessRequest)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${processId}-request.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Box component="span" {...containerProps}>
        <ActionIcon.Group style={revealStyle}>
          <Tooltip label={"Import process request"}>
            <ActionIcon
              {...styles.actionIcon.sm}
              aria-label="Import process request"
              variant="subtle"
              onClick={handleImportClick}
              disabled={!processId}
            >
              <IconUpload {...styles.icon.sm} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={"Export process request"}>
            <ActionIcon
              {...styles.actionIcon.sm}
              aria-label="Export process request"
              variant="subtle"
              onClick={handleExportClick}
              disabled={!currentProcessRequest}
            >
              <IconDownload {...styles.icon.sm} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={"Execute process"}>
            <ActionIcon
              {...styles.actionIcon.sm}
              variant="filled"
              onClick={onExecute}
              loading={isSubmitting}
              disabled={!canExecute}
            >
              <IconPlayerPlayFilled {...styles.icon.sm} />
            </ActionIcon>
          </Tooltip>
        </ActionIcon.Group>
      </Box>
      <input
        ref={requestFileInputRef}
        hidden
        type="file"
        accept="application/json,.json"
        onChange={handleImportChange}
      />
    </>
  );
}
