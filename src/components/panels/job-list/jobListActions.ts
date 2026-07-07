import type { JobInfo, JobStatus } from "@/service";
import {
  compareListActionDate,
  compareListActionText,
  includesListActionTerm,
  type ListActionFilterCategory,
  type ListActionSortCriterion,
} from "@/components/common/listActions";

export const defaultJobSortId = "job-created";
export const defaultJobSortDirection = "desc";

const jobProcessFilterPrefix = "job-process-";

const jobStatuses: JobStatus[] = [
  "accepted",
  "running",
  "successful",
  "failed",
  "dismissed",
];

const jobStatusLabels: Record<JobStatus, string> = {
  accepted: "Accepted",
  running: "Running",
  successful: "Successful",
  failed: "Failed",
  dismissed: "Dismissed",
};

export const jobStatusFilterCategory: ListActionFilterCategory<JobInfo> = {
  id: "job-status",
  label: "Status",
  criteria: jobStatuses.map((status) => ({
    id: `job-status-${status}`,
    label: jobStatusLabels[status],
    matches: (jobInfo) => jobInfo.status === status,
  })),
};

export const jobDetailsFilterCategory: ListActionFilterCategory<JobInfo> = {
  id: "job-details",
  label: "Details",
  criteria: [
    {
      id: "job-has-message",
      label: "Has message",
      matches: (jobInfo) => Boolean(jobInfo.message?.trim()),
    },
    {
      id: "job-has-progress",
      label: "Has progress",
      matches: (jobInfo) => typeof jobInfo.progress === "number",
    },
    {
      id: "job-has-traceback",
      label: "Has traceback",
      matches: hasTraceback,
    },
  ],
};

export const jobSortCriteria: ListActionSortCriterion<JobInfo>[] = [
  {
    id: defaultJobSortId,
    label: "Created",
    compare: (a, b) =>
      compareListActionDate(a.created, b.created) || compareJobId(a, b),
  },
  {
    id: "job-started",
    label: "Start time",
    compare: (a, b) =>
      compareListActionDate(a.started, b.started) || compareJobId(a, b),
  },
  {
    id: "job-updated",
    label: "Update time",
    compare: (a, b) =>
      compareListActionDate(a.updated, b.updated) || compareJobId(a, b),
  },
  {
    id: "job-finished",
    label: "Finish time",
    compare: (a, b) =>
      compareListActionDate(a.finished, b.finished) || compareJobId(a, b),
  },
  {
    id: "job-process-id",
    label: "Process ID",
    compare: (a, b) =>
      compareListActionText(a.processID, b.processID) || compareJobId(a, b),
  },
  {
    id: "job-id",
    label: "Job ID",
    compare: compareJobId,
  },
  {
    id: "job-status",
    label: "Status",
    compare: (a, b) =>
      compareListActionText(a.status, b.status) || compareJobId(a, b),
  },
];

export function createJobListActionsConfig(
  jobs: JobInfo[],
  selectedFilterIds: string[],
) {
  return {
    search: jobMatchesSearch,
    filterCategories: createJobFilterCategories(jobs, selectedFilterIds),
    sortCriteria: jobSortCriteria,
  };
}

export function createJobFilterCategories(
  jobs: JobInfo[],
  selectedFilterIds: string[],
): ListActionFilterCategory<JobInfo>[] {
  const processIds = new Set(
    jobs.map((jobInfo) => jobInfo.processID).filter(Boolean),
  );
  selectedFilterIds.forEach((filterId) => {
    const processId = processIdFromFilterId(filterId);
    if (processId) {
      processIds.add(processId);
    }
  });

  const categories = [jobStatusFilterCategory];
  const sortedProcessIds = Array.from(processIds).sort(compareListActionText);

  if (sortedProcessIds.length > 0) {
    categories.push({
      id: "job-process",
      label: "Process",
      criteria: sortedProcessIds.map((processId) => ({
        id: processFilterId(processId),
        label: processId,
        matches: (jobInfo) => jobInfo.processID === processId,
      })),
    });
  }

  categories.push(jobDetailsFilterCategory);
  return categories;
}

export function jobMatchesSearch(
  jobInfo: JobInfo,
  searchTerm: string,
): boolean {
  const traceback = jobInfo["x-traceback"];
  const tracebackText = Array.isArray(traceback)
    ? traceback.join(" ")
    : traceback;
  return [
    jobInfo.processID,
    jobInfo.jobID,
    jobInfo.status,
    jobInfo.message,
    jobInfo.progress,
    jobInfo.created,
    jobInfo.started,
    jobInfo.updated,
    jobInfo.finished,
    tracebackText,
  ].some((value) => includesListActionTerm(value, searchTerm));
}

export function processFilterId(processId: string): string {
  return `${jobProcessFilterPrefix}${processId}`;
}

function compareJobId(a: JobInfo, b: JobInfo): number {
  return compareListActionText(a.jobID, b.jobID);
}

function hasTraceback(jobInfo: JobInfo): boolean {
  const traceback = jobInfo["x-traceback"];
  if (Array.isArray(traceback)) {
    return traceback.length > 0;
  }
  return Boolean(traceback?.trim());
}

function processIdFromFilterId(filterId: string): string | null {
  return filterId.startsWith(jobProcessFilterPrefix)
    ? filterId.slice(jobProcessFilterPrefix.length)
    : null;
}
