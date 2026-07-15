import { useMemo, useState } from "react";
import { ActionIcon, Stack, Tooltip } from "@mantine/core";
import {
  IconBrightnessAuto,
  IconBrightnessAutoFilled,
  IconJson,
  IconMathFunction,
} from "@tabler/icons-react";

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
import {
  getFieldFromProcessDescriptionInputs,
  getVisibleInputFields,
} from "@/utils/field";

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
    if (processRequests) {
      executeActiveProcess(processRequests);
    }
  };
  const inputActions = processDescription ? (
    <>
      {hasAdvancedInputs ? (
        <Tooltip label={"Show advanced inputs"}>
          <ActionIcon
            aria-label="Show advanced"
            {...styles.actionIcon.sm}
            variant={showAdvancedInputs ? "filled" : "subtle"}
            onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
          >
            {showAdvancedInputs ? (
              <IconBrightnessAutoFilled {...styles.icon.sm} />
            ) : (
              <IconBrightnessAuto {...styles.icon.sm} />
            )}
          </ActionIcon>
        </Tooltip>
      ) : null}
      <Tooltip label={"Use raw JSON-value input fields"}>
        <ActionIcon
          aria-label="Use raw JSON-value input fields"
          {...styles.actionIcon.sm}
          variant={processEditorMode === "json" ? "filled" : "subtle"}
          onClick={() =>
            setProcessEditorMode(processEditorMode === "json" ? "form" : "json")
          }
        >
          <IconJson {...styles.icon.sm} />
        </ActionIcon>
      </Tooltip>
    </>
  ) : null;
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
          inputActions={inputActions}
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
