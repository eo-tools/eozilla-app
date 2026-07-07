import { useState } from "react";
import { Stack } from "@mantine/core";
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
} from "@/store/hooks";
import type { ProcessDescription } from "@/service";
import { Panel } from "@/components/common/Panel";
import { ResourceView } from "@/components/common/ResourceView";
import ProcessDescriptionView from "@/components/panels/process/ProcessDescriptionView";
import { executeActiveProcess } from "@/store/actions";
import styles from "@/components/common/styles";
import { SubPanel } from "@/components/common/SubPanel";
import ProcessInputsSubPanel from "@/components/panels/process/ProcessInputsSubPanel";
import ProcessOutputsSubPanel from "@/components/panels/process/ProcessOutputsSubPanel";
import ProcessRequestActions from "@/components/panels/process/ProcessRequestActions";

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
  const [openedSubPanels, setOpenedSubPanels] = useState(["inputs", "outputs"]);
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
        />
      </Panel.Header>
      <Panel.Section grow scroll>
        <ResourceView {...processesState} nullText="No process selected.">
          {(processDescription: ProcessDescription) => (
            <Stack>
              <ProcessDescriptionView processDescription={processDescription} />
              <SubPanel values={openedSubPanels} setValues={setOpenedSubPanels}>
                <ProcessOutputsSubPanel
                  processDescription={processDescription}
                  processOutputs={activeProcessOutputs || {}}
                  setProcessOutput={setProcessRequestOutput}
                />
                <ProcessInputsSubPanel
                  processDescription={processDescription}
                  processInputs={activeProcessInputs || {}}
                  setProcessInput={setProcessRequestInput}
                />
              </SubPanel>
            </Stack>
          )}
        </ResourceView>
      </Panel.Section>
    </Panel>
  );
}
