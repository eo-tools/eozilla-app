import type { JobInfo } from "@/service";
import type { Optional } from "@/utils/common";
import { UnavailableHint } from "@/components/common/UnavailableHint";
import { JobItemView } from "./JobItemView";
import type { StoredJobRequests } from "@/state/jobRequests";

export interface JobListViewProps {
  jobs: JobInfo[];
  activeJobId?: string;
  activateJob: (jobId: Optional<string>) => void;
  dismissJob: (jobId: string) => void;
  jobRequests: StoredJobRequests;
  onUseRequest: (jobInfo: JobInfo) => void;
}

export default function JobListView({
  jobs,
  activeJobId,
  activateJob,
  dismissJob,
  jobRequests,
  onUseRequest,
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
      canUseRequest={Boolean(jobRequests[jobInfo.jobID])}
      onUseRequest={onUseRequest}
    />
  ));
}
