import ProcessInputsView from "@/components/panels/process/ProcessInputsView";
import GeneratedProcessInputsView from "@/components/panels/process/GeneratedProcessInputsView";
import { SubPanel } from "@/components/common/SubPanel";
import type { Input, ProcessDescription, ProcessInputs } from "@/service";
import type { ObjectField } from "@/utils/field";

interface ProcessInputsSubPanelProps {
  processDescription: ProcessDescription;
  processInputs: ProcessInputs | null;
  setProcessInput: (name: string, value: Input) => void;
  processEditorMode: "form" | "json";
  hideAdvancedInputs: boolean;
  inputsField: ObjectField;
}

export default function ProcessInputsSubPanel({
  processDescription,
  processInputs,
  setProcessInput,
  processEditorMode,
  hideAdvancedInputs,
  inputsField,
}: ProcessInputsSubPanelProps) {
  return (
    <SubPanel.Item value={"inputs"} title={"Inputs"}>
      {processEditorMode === "form" ? (
        <GeneratedProcessInputsView
          processInputs={processInputs || {}}
          setProcessInput={setProcessInput}
          hideAdvanced={hideAdvancedInputs}
          inputsField={inputsField}
        />
      ) : (
        <ProcessInputsView
          processDescription={processDescription}
          processInputs={processInputs || {}}
          setProcessInput={setProcessInput}
          hideAdvanced={hideAdvancedInputs}
          inputsField={inputsField}
        />
      )}
    </SubPanel.Item>
  );
}
