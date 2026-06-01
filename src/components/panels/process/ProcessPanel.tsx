import { ActionIcon, Stack, Text, Tooltip } from "@mantine/core";
import { IconMathFunction, IconPlayerPlayFilled } from "@tabler/icons-react";

import {
  useActiveProcessInputs,
  useActiveProcessDescription,
  useProcessExecution,
  useActiveProcessId,
} from "@/store/hooks";
import type { ProcessDescription } from "@/service";
import { Panel } from "@/components/common/Panel";
import { ResourceView } from "@/components/common/ResourceView";
import ProcessDescriptionView from "@/components/panels/process/ProcessDescriptionView";
import ProcessInputsView from "@/components/panels/process/ProcessInputsView";
import { executeActiveProcess, setActiveProcessInput } from "@/store/actions";
import styles from "@/components/common/styles";

export default function ProcessPanel() {
  const processesState = useActiveProcessDescription();
  const { processDescription } = processesState;
  const activeProcessInputs = useActiveProcessInputs();
  const processId = useActiveProcessId();
  const processExecution = useProcessExecution();
  const isSubmitting =
    processExecution &&
    processExecution.processId === processId &&
    processExecution.submitting;
  const canExecute =
    processId &&
    (!processExecution ||
      processExecution.processId !== processId ||
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
              <Text fw={600} size={"sm"}>
                INPUTS
              </Text>
              <ProcessInputsView
                processDescription={processDescription}
                processInputs={activeProcessInputs || {}}
                setProcessInput={setActiveProcessInput}
              />
            </Stack>
          )}
        </ResourceView>
      </Panel.Section>
    </Panel>
  );
}
