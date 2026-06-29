import { useMemo, useState } from "react";
import { Group, SegmentedControl, Switch } from "@mantine/core";

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
    <Group gap="xs" wrap="nowrap">
      {hasAdvancedInputs ? (
        <Switch
          label={"Show advanced"}
          checked={showAdvancedInputs}
          onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
          size="xs"
          styles={{
            body: { alignItems: "center" },
            label: { whiteSpace: "nowrap" },
          }}
        />
      ) : null}
      <SegmentedControl
        size="xs"
        value={inputEditorMode}
        onChange={(value) =>
          setProcessInputEditorMode(value === "json" ? "json" : "form")
        }
        data={[
          { label: "Form", value: "form" },
          { label: "JSON", value: "json" },
        ]}
      />
    </Group>
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
