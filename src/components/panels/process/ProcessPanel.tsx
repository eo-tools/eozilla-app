import { ActionIcon, Stack, Tooltip } from "@mantine/core";
import { IconMathFunction, IconPlayerPlayFilled } from "@tabler/icons-react";

import {
  useActiveProcessInputs,
  useActiveProcessOutputs,
  useActiveProcessDescription,
  useProcessExecution,
  useActiveProcessId,
} from "@/store/hooks";
import type { ProcessDescription } from "@/service";
import { Panel } from "@/components/common/Panel";
import { ResourceView } from "@/components/common/ResourceView";
import ProcessDescriptionView from "@/components/panels/process/ProcessDescriptionView";
import ProcessInputsView from "@/components/panels/process/ProcessInputsView";
import ProcessOutputsView from "@/components/panels/process/ProcessOutputsView";
import {
  executeActiveProcess,
  setActiveProcessInput,
  setActiveProcessOutput,
} from "@/store/actions";
import styles from "@/components/common/styles";
import { SubPanel } from "@/components/common/SubPanel";
import { useState } from "react";

export default function ProcessPanel() {
  const processesState = useActiveProcessDescription();
  const { processDescription } = processesState;
  const activeProcessInputs = useActiveProcessInputs();
  const activeProcessOutputs = useActiveProcessOutputs();
  const processId = useActiveProcessId();
  const processExecution = useProcessExecution();
  const [openedSubPanels, setOpenedSubPanels] = useState(["inputs", "outputs"]);
  const isSubmitting =
    processExecution &&
    processExecution.request.processId === processId &&
    processExecution.submitting;
  const canExecute =
    processId &&
    (!processExecution ||
      processExecution.request.processId !== processId ||
      !processExecution.submitting);
  return (
    <Panel>
      <Panel.Header
        title={"Process"}
        icon={<IconMathFunction {...styles.panel.header.icon} />}
        id={processDescription?.id}
      >
        <ActionIcon.Group>
          <Tooltip label={"Execute process"}>
            <ActionIcon
              {...styles.actionIcon.sm}
              variant="filled"
              onClick={executeActiveProcess}
              loading={isSubmitting}
              disabled={!canExecute}
            >
              <IconPlayerPlayFilled {...styles.icon.sm} />
            </ActionIcon>
          </Tooltip>
        </ActionIcon.Group>
      </Panel.Header>
      <Panel.Section grow scroll>
        <ResourceView {...processesState} nullText="No process selected.">
          {(processDescription: ProcessDescription) => (
            <Stack>
              <ProcessDescriptionView processDescription={processDescription} />
              <SubPanel values={openedSubPanels} setValues={setOpenedSubPanels}>
                <SubPanel.Item value={"inputs"} title={"Inputs"}>
                  <ProcessInputsView
                    processDescription={processDescription}
                    processInputs={activeProcessInputs || {}}
                    setProcessInput={setActiveProcessInput}
                  />
                </SubPanel.Item>
                <SubPanel.Item value={"outputs"} title={"Outputs"}>
                  <ProcessOutputsView
                    processDescription={processDescription}
                    processOutputs={activeProcessOutputs || {}}
                    setProcessOutput={setActiveProcessOutput}
                  />
                </SubPanel.Item>
              </SubPanel>
            </Stack>
          )}
        </ResourceView>
      </Panel.Section>
    </Panel>
  );
}
