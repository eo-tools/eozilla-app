import type { ProcessSummary } from "@/service";
import { UnavailableHint } from "@/components/common/UnavailableHint";
import ProcessItemView from "./ProcessItemView";

export interface ProcessViewProps {
  processes: ProcessSummary[];
  activeProcessId?: string;
  activateProcess: (processId: string) => void;
}

export function ProcessListView({
  processes,
  activeProcessId,
  activateProcess,
}: ProcessViewProps) {
  if (processes.length === 0) {
    return <UnavailableHint message="The list of processes is empty." />;
  }

  return (
    <>
      {processes.map((process) => (
        <ProcessItemView
          key={process.id}
          process={process}
          activeProcessId={activeProcessId}
          activateProcess={activateProcess}
        />
      ))}
    </>
  );
}
