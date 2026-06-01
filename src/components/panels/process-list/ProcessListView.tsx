import type { ProcessSummary } from "@/service";
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
