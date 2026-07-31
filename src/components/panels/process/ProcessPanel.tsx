import { useMemo, useState } from "react";
import { Divider, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconMathFunction } from "@tabler/icons-react";

import {
  useActiveProcessInputs,
  useActiveProcessOutputs,
  useActiveProcessDescription,
  useProcessExecution,
  useActiveProcessId,
  useActiveProcessRequestsActions,
  useSetProcessRequest,
  useProcessRequests,
  useProcessEditorMode,
} from "@/store/hooks";
import type { ProcessDescription } from "@/service";
import { Panel } from "@/components/common/Panel";
import { ResourceView } from "@/components/common/ResourceView";
import ProcessDescriptionView from "@/components/panels/process/ProcessDescriptionView";
import { executeActiveProcess, setProcessEditorMode } from "@/store/actions";
import styles from "@/components/common/styles";
import { SubPanel } from "@/components/common/SubPanel";
import ProcessInputsSubPanel from "@/components/panels/process/ProcessInputsSubPanel";
import ProcessOutputsSubPanel from "@/components/panels/process/ProcessOutputsSubPanel";
import ProcessRequestActions from "@/components/panels/process/ProcessRequestActions";
import { getErrorMessage } from "@/utils/common";
import {
  getFieldFromProcessDescriptionInputs,
  getVisibleInputFields,
} from "@/utils/field";
import { validateJsonValue } from "@/utils/json";

export default function ProcessPanel() {
  const processesState = useActiveProcessDescription();
  const { processDescription } = processesState;
  const processRequests = useProcessRequests();
  const setProcessRequest = useSetProcessRequest();
  const activeProcessInputs = useActiveProcessInputs();
  const activeProcessOutputs = useActiveProcessOutputs();
  const { setProcessRequestInput, setProcessRequestOutput } =
    useActiveProcessRequestsActions();
  const processId = useActiveProcessId();
  const processExecution = useProcessExecution();
  const processEditorMode = useProcessEditorMode();
  const [openedSubPanels, setOpenedSubPanels] = useState(["inputs", "outputs"]);
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const inputsField = useMemo(
    () =>
      processDescription
        ? getFieldFromProcessDescriptionInputs(processDescription)
        : undefined,
    [processDescription],
  );
  const hasAdvancedInputs = useMemo(
    () =>
      inputsField
        ? getVisibleInputFields(inputsField).some((field) =>
            Boolean(field.advanced),
          )
        : false,
    [inputsField],
  );
  const currentProcessRequest =
    processId && processRequests ? processRequests[processId] : undefined;
  const isSubmitting = Boolean(
    processExecution &&
    processExecution.processId === processId &&
    processExecution.submitting,
  );
  const canExecute = Boolean(
    processRequests &&
    processId &&
    (!processExecution ||
      processExecution.processId !== processId ||
      !processExecution.submitting),
  );
  const handleExecuteProcess = () => {
    if (!processRequests || !processId || !inputsField) {
      return;
    }

    const processRequest = processRequests[processId];
    if (!processRequest) {
      return;
    }

    try {
      validateJsonValue(
        inputsField.name,
        processRequest.inputs ?? {},
        inputsField.schema,
      );
    } catch (error) {
      notifications.show({
        message: `Invalid process inputs: ${getErrorMessage(error)}`,
        color: "red",
      });
      return;
    }

    executeActiveProcess(processRequests);
  };
  return (
    <Panel>
      <Panel.Header
        title={"Process"}
        icon={<IconMathFunction {...styles.panel.header.icon} />}
        id={processDescription?.title}
      >
        <ProcessRequestActions
          processId={processId}
          processDescription={processDescription}
          currentProcessRequest={currentProcessRequest}
          isSubmitting={isSubmitting}
          canExecute={canExecute}
          onExecute={handleExecuteProcess}
          setProcessRequest={setProcessRequest}
          processEditorMode={processEditorMode}
          onSetProcessEditorMode={setProcessEditorMode}
          hasAdvancedInputs={hasAdvancedInputs}
          showAdvancedInputs={showAdvancedInputs}
          onToggleAdvancedInputs={() =>
            setShowAdvancedInputs(!showAdvancedInputs)
          }
        />
      </Panel.Header>
      <Panel.Section grow scroll>
        <ResourceView {...processesState} nullText="No process selected.">
          {(processDescription: ProcessDescription) =>
            inputsField ? (
              <Stack>
                <ProcessDescriptionView
                  processDescription={processDescription}
                />
                <SubPanel
                  values={openedSubPanels}
                  setValues={setOpenedSubPanels}
                >
                  <ProcessInputsSubPanel
                    processDescription={processDescription}
                    processInputs={activeProcessInputs || {}}
                    setProcessInput={setProcessRequestInput}
                    processEditorMode={processEditorMode}
                    hideAdvancedInputs={
                      hasAdvancedInputs && !showAdvancedInputs
                    }
                    inputsField={inputsField}
                  />
                  <Divider my={8} />
                  <ProcessOutputsSubPanel
                    processDescription={processDescription}
                    processOutputs={activeProcessOutputs || {}}
                    setProcessOutput={setProcessRequestOutput}
                  />
                </SubPanel>
              </Stack>
            ) : null
          }
        </ResourceView>
      </Panel.Section>
    </Panel>
  );
}
