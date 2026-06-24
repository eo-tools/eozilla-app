import { useMemo, useState } from "react";
import { Switch } from "@mantine/core";

import ProcessInputsView from "@/components/panels/process/ProcessInputsView";
import { SubPanel } from "@/components/common/SubPanel";
import type { Input, ProcessDescription, ProcessInputs } from "@/service";
import {
  getFieldFromProcessDescriptionInputs,
  getVisibleInputFieldEntries,
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

  const inputsField: ObjectField = useMemo(
    () => getFieldFromProcessDescriptionInputs(processDescription),
    [processDescription],
  );

  const hasAdvancedInputs = getVisibleInputFieldEntries(inputsField).some(
    ({ field }) => Boolean(field.advanced),
  );

  const inputsActions = hasAdvancedInputs ? (
    <Switch
      label={"Show advanced"}
      checked={showAdvancedInputs}
      onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
      size={"xs"}
    />
  ) : null;
  return (
    <SubPanel.Item value={"inputs"} title={"Inputs"} actions={inputsActions}>
      <ProcessInputsView
        processDescription={processDescription}
        processInputs={processInputs || {}}
        setProcessInput={setProcessInput}
        hideAdvanced={Boolean(inputsActions) && !showAdvancedInputs}
        inputsField={inputsField}
      />
    </SubPanel.Item>
  );
}
