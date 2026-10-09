import { type JobResults } from "@/service";

import JobResultView from "./JobResultView";
import type { DialogId } from "@/state/types";

interface JobResultsViewProps {
  jobResults: JobResults;
  openDialog: (dialogId: DialogId, dialogData?: unknown) => void;
}

export default function JobResultsView({
  jobResults,
  openDialog,
}: JobResultsViewProps) {
  return Object.keys(jobResults).map((outputName, outputIndex) => {
    const jobResult = jobResults[outputName]!;
    return (
      <JobResultView
        key={outputName}
        outputName={outputName}
        outputIndex={outputIndex}
        jobResult={jobResult}
        openDialog={openDialog}
      />
    );
  });
}
