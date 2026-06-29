import { useMemo, useState } from "react";
import { ActionIcon, Tooltip } from "@mantine/core";
import {
  IconBrightnessAuto,
  IconBrightnessAutoFilled,
  IconJson,
} from "@tabler/icons-react";

import ProcessInputsView from "@/components/panels/process/ProcessInputsView";
import GeneratedProcessInputsView from "@/components/panels/process/GeneratedProcessInputsView";
import { SubPanel } from "@/components/common/SubPanel";
import type { Input, ProcessDescription, ProcessInputs } from "@/service";
import { setProcessInputEditorMode } from "@/store/actions";
import { useProcessInputEditorMode } from "@/store/hooks";
import {
  getFieldFromProcessDescriptionInputs,
  getVisibleInputFields,
  type ObjectField,
} from "@/utils/field";
import styles from "@/components/common/styles";

interface ProcessInputsSubPanelProps {
  processDescription: ProcessDescription;
  processInputs: ProcessInputs | null;
  setProcessInput: (name: string, value: Input) => void;
}

export default function ProcessInputsSubPanel({
  processDescription,
  processInputs,
  setProcessInput,
}: ProcessInputsSubPanelProps) {
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);
  const inputEditorMode = useProcessInputEditorMode();

  const inputsField: ObjectField = useMemo(
    () => getFieldFromProcessDescriptionInputs(processDescription),
    [processDescription],
  );

  const hasAdvancedInputs = getVisibleInputFields(inputsField).some((field) =>
    Boolean(field.advanced),
  );

  const inputsActions = (
    <ActionIcon.Group>
      {hasAdvancedInputs ? (
        <Tooltip label={"Show advanced inputs"}>
          <ActionIcon
            aria-label="Show advanced"
            {...styles.actionIcon.md}
            variant={showAdvancedInputs ? "filled" : "subtle"}
            onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
          >
            {showAdvancedInputs ? (
              <IconBrightnessAutoFilled {...styles.icon.md} />
            ) : (
              <IconBrightnessAuto {...styles.icon.md} />
            )}
          </ActionIcon>
        </Tooltip>
      ) : null}
      <Tooltip label={"Use raw JSON-value input fields"}>
        <ActionIcon
          aria-label="Use raw JSON-value input fields"
          {...styles.actionIcon.md}
          mr={10}
          variant={inputEditorMode === "json" ? "filled" : "subtle"}
          onClick={() =>
            setProcessInputEditorMode(
              inputEditorMode === "json" ? "form" : "json",
            )
          }
        >
          <IconJson {...styles.icon.md} />
        </ActionIcon>
      </Tooltip>
    </ActionIcon.Group>
  );
  return (
    <SubPanel.Item value={"inputs"} title={"Inputs"} actions={inputsActions}>
      {inputEditorMode === "form" ? (
        <GeneratedProcessInputsView
          processInputs={processInputs || {}}
          setProcessInput={setProcessInput}
          hideAdvanced={hasAdvancedInputs && !showAdvancedInputs}
          inputsField={inputsField}
        />
      ) : (
        <ProcessInputsView
          processDescription={processDescription}
          processInputs={processInputs || {}}
          setProcessInput={setProcessInput}
          hideAdvanced={hasAdvancedInputs && !showAdvancedInputs}
          inputsField={inputsField}
        />
      )}
    </SubPanel.Item>
  );
}
