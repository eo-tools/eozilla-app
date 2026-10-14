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
  return Object.entries(jobResults).map(([outputName, jobResult]) => (
    <JobResultView
      key={outputName}
      outputName={outputName}
      jobResult={jobResult}
      openDialog={openDialog}
    />
  ));
}
