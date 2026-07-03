import type { JobInfo } from "@/service";
import type { Optional } from "@/utils/common";
import { UnavailableHint } from "@/components/common/UnavailableHint";
import { JobItemView } from "./JobItemView";

export interface JobListViewProps {
  jobs: JobInfo[];
  activeJobId?: string;
  activateJob: (jobId: Optional<string>) => void;
  dismissJob: (jobId: string) => void;
}

export default function JobListView({
  jobs,
  activeJobId,
  activateJob,
  dismissJob,
}: JobListViewProps) {
  if (jobs.length === 0) {
    return <UnavailableHint message="The list of jobs is empty." />;
  }
  return jobs.map((jobInfo) => (
    <JobItemView
      key={jobInfo.jobID}
      jobInfo={jobInfo}
      activeJobId={activeJobId}
      activateJob={activateJob}
      dismissJob={dismissJob}
    />
  ));
}
