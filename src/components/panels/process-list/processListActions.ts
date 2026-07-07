import type { ProcessSummary } from "@/service";
import {
  compareListActionText,
  includesListActionTerm,
  type ListActionFilterCategory,
  type ListActionSortCriterion,
} from "@/components/common/listActions";

export const defaultProcessSortId = "process-id";
export const defaultProcessSortDirection = "asc";

export const processFilterCategories: ListActionFilterCategory<ProcessSummary>[] =
  [
    {
      id: "job-control",
      label: "Job control",
      criteria: [
        {
          id: "process-job-control-sync",
          label: "Sync execute",
          matches: (process) =>
            process.jobControlOptions?.includes("sync-execute") ?? false,
        },
        {
          id: "process-job-control-async",
          label: "Async execute",
          matches: (process) =>
            process.jobControlOptions?.includes("async-execute") ?? false,
        },
        {
          id: "process-job-control-dismiss",
          label: "Dismiss",
          matches: (process) =>
            process.jobControlOptions?.includes("dismiss") ?? false,
        },
      ],
    },
    {
      id: "output-transmission",
      label: "Output",
      criteria: [
        {
          id: "process-output-value",
          label: "Value",
          matches: (process) =>
            process.outputTransmission?.includes("value") ?? false,
        },
        {
          id: "process-output-reference",
          label: "Reference",
          matches: (process) =>
            process.outputTransmission?.includes("reference") ?? false,
        },
      ],
    },
    {
      id: "metadata",
      label: "Metadata",
      criteria: [
        {
          id: "process-has-description",
          label: "Has description",
          matches: (process) => Boolean(process.description?.trim()),
        },
        {
          id: "process-has-keywords",
          label: "Has keywords",
          matches: (process) => Boolean(process.keywords?.length),
        },
        {
          id: "process-has-links",
          label: "Has links",
          matches: (process) => Boolean(process.links?.length),
        },
      ],
    },
  ];

export const processSortCriteria: ListActionSortCriterion<ProcessSummary>[] = [
  {
    id: defaultProcessSortId,
    label: "Process ID",
    compare: (a, b) => compareListActionText(a.id, b.id),
  },
  {
    id: "process-title",
    label: "Title",
    compare: (a, b) =>
      compareListActionText(a.title, b.title) ||
      compareListActionText(a.id, b.id),
  },
  {
    id: "process-version",
    label: "Version",
    compare: (a, b) =>
      compareListActionText(a.version, b.version) ||
      compareListActionText(a.id, b.id),
  },
];

export const processListActionsConfig = {
  search: processMatchesSearch,
  filterCategories: processFilterCategories,
  sortCriteria: processSortCriteria,
};

export function processMatchesSearch(
  process: ProcessSummary,
  searchTerm: string,
): boolean {
  return [process.id, process.title, process.description].some((value) =>
    includesListActionTerm(value, searchTerm),
  );
}
