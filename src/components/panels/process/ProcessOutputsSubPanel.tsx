import type { Output, ProcessDescription, ProcessOutputs } from "@/service";
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
  return (
    <SubPanel.Item value={"outputs"} title={"Outputs"}>
      <ProcessOutputsView
        processDescription={processDescription}
        processOutputs={processOutputs}
        setProcessOutput={setProcessOutput}
      />
    </SubPanel.Item>
  );
}
