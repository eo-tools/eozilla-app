import { useRef, type ChangeEvent } from "react";
import { ActionIcon, Box, Menu, Text, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconDownload,
  IconDotsVertical,
  IconEye,
  IconPlayerPlayFilled,
  IconRestore,
  IconUpload,
  IconCheck,
} from "@tabler/icons-react";

import type { ProcessDescription, ProcessRequest } from "@/service";
import { useHoverReveal } from "@/components/common/useHoverReveal";
import styles from "@/components/common/styles";
import {
  createInitialProcessInputs,
  createInitialProcessOutputs,
} from "@/store/processRequests";
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
  processEditorMode: "form" | "json";
  onSetProcessEditorMode: (mode: "form" | "json") => void;
  hasAdvancedInputs?: boolean;
  showAdvancedInputs?: boolean;
  onToggleAdvancedInputs?: () => void;
}

export default function ProcessRequestActions({
  processId,
  processDescription,
  currentProcessRequest,
  isSubmitting,
  canExecute,
  onExecute,
  setProcessRequest,
  processEditorMode,
  onSetProcessEditorMode,
  hasAdvancedInputs,
  showAdvancedInputs,
  onToggleAdvancedInputs,
}: ProcessRequestActionsProps) {
  const requestFileInputRef = useRef<HTMLInputElement>(null);
  const { containerProps } = useHoverReveal(200, 0.05, 1);

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

  const handleResetInputsClick = () => {
    if (!processId || !processDescription) {
      return;
    }

    setProcessRequest(processId, {
      inputs: createInitialProcessInputs(processDescription),
      outputs:
        currentProcessRequest?.outputs ??
        createInitialProcessOutputs(processDescription),
    });
    notifications.show({ message: "Process inputs reset." });
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
        <Menu
          shadow="md"
          width={220}
          trigger="hover"
          openDelay={100}
          closeOnItemClick={false}
        >
          <Menu.Target>
            <ActionIcon
              {...styles.actionIcon.sm}
              aria-label="Process options"
              variant="transparent"
            >
              <IconDotsVertical {...styles.icon.sm} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Sub
              position="right-start"
              offset={{ mainAxis: 8, crossAxis: -4 }}
            >
              <Menu.Sub.Target>
                <Menu.Sub.Item
                  leftSection={<IconEye {...styles.icon.sm} />}
                  rightSection={
                    <Text size="xs" c="dimmed" tt="uppercase">
                      {processEditorMode}
                    </Text>
                  }
                >
                  View mode
                </Menu.Sub.Item>
              </Menu.Sub.Target>
              <Menu.Sub.Dropdown>
                <Menu.Item
                  onClick={() => onSetProcessEditorMode("form")}
                  disabled={processEditorMode === "form"}
                >
                  Form
                </Menu.Item>
                <Menu.Item
                  onClick={() => onSetProcessEditorMode("json")}
                  disabled={processEditorMode === "json"}
                >
                  JSON
                </Menu.Item>
              </Menu.Sub.Dropdown>
            </Menu.Sub>
            <Menu.Divider />
            {hasAdvancedInputs && onToggleAdvancedInputs ? (
              <Menu.Item
                leftSection={
                  showAdvancedInputs ? (
                    <IconCheck {...styles.icon.sm} />
                  ) : (
                    <Box w={16} />
                  )
                }
                onClick={onToggleAdvancedInputs}
              >
                Advanced inputs
              </Menu.Item>
            ) : null}
            <Menu.Item
              leftSection={<IconUpload {...styles.icon.sm} />}
              onClick={handleImportClick}
              disabled={!processId}
            >
              Import process request
            </Menu.Item>
            <Menu.Item
              leftSection={<IconDownload {...styles.icon.sm} />}
              onClick={handleExportClick}
              disabled={!currentProcessRequest}
            >
              Export process request
            </Menu.Item>
            <Menu.Item
              leftSection={<IconRestore {...styles.icon.sm} />}
              onClick={handleResetInputsClick}
              disabled={!processId || !processDescription}
            >
              Reset to defaults
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
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
