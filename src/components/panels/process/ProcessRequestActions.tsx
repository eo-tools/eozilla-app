import { useRef, type ChangeEvent, type ReactNode } from "react";
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
  setProcessRequest: (
    processId: string,
    processRequest: ProcessRequest,
  ) => void;
  inputActions?: ReactNode;
}

export default function ProcessRequestActions({
  processId,
  processDescription,
  currentProcessRequest,
  isSubmitting,
  canExecute,
  onExecute,
  setProcessRequest,
  inputActions,
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

    const blob = new Blob(
      [stringifyProcessRequestJson(currentProcessRequest)],
      {
        type: "application/json",
      },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${processId}-request.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Box
        component="span"
        {...containerProps}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          flex: 1,
          minWidth: 0,
        }}
      >
        <Box
          component="span"
          style={{
            ...revealStyle,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
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
        </Box>
        {inputActions ? (
          <Box
            component="span"
            ml={4}
            style={{ display: "flex", alignItems: "center", gap: 4 }}
          >
            {inputActions}
          </Box>
        ) : null}
        <Tooltip label={"Execute process"}>
          <ActionIcon
            {...styles.actionIcon.sm}
            variant="filled"
            onClick={onExecute}
            loading={isSubmitting}
            disabled={!canExecute}
            ml={4}
          >
            <IconPlayerPlayFilled {...styles.icon.sm} />
          </ActionIcon>
        </Tooltip>
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
