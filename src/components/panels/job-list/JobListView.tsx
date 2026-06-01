import { useMemo } from "react";

import type { JobInfo, JobList } from "@/service";
import type { Optional } from "@/utils/common";
import { JobItemView } from "./JobItemView";

export interface JobListViewProps {
  jobList: JobList;
  activeJobId?: string;
  activateJob: (jobId: Optional<string>) => void;
  dismissJob: (jobId: string) => void;
}

export default function JobListView({
  jobList,
  activeJobId,
  activateJob,
  dismissJob,
}: JobListViewProps) {
  const jobs = useMemo(
    () => [...jobList.jobs].sort(sortByCreationDate),
    [jobList],
  );
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

const sortByCreationDate = (a: JobInfo, b: JobInfo) => {
  if (a.created && b.created) {
    return b.created.localeCompare(a.created);
  }
  return a.jobID.localeCompare(b.jobID);
};
