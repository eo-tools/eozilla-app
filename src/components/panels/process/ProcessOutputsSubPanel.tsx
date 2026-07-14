import type { Output, ProcessDescription, ProcessOutputs } from "@/service";
import { useProcessEditorMode } from "@/store/hooks";
import ProcessOutputsView from "@/components/panels/process/ProcessOutputsView";
import { SubPanel } from "@/components/common/SubPanel";

interface ProcessOutputsSubPanelProps {
  processDescription: ProcessDescription;
  processOutputs: ProcessOutputs;
  setProcessOutput: (name: string, output?: Output) => void;
}

export default function ProcessOutputsSubPanel({
  processDescription,
  processOutputs,
  setProcessOutput,
}: ProcessOutputsSubPanelProps) {
  const processEditorMode = useProcessEditorMode();

  return (
    <SubPanel.Item value={"outputs"} title={"Outputs"}>
      <ProcessOutputsView
        processDescription={processDescription}
        processOutputs={processOutputs}
        setProcessOutput={setProcessOutput}
        formMode={processEditorMode === "form"}
      />
    </SubPanel.Item>
  );
}
