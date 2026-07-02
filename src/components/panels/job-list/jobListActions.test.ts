import { describe, expect, it } from "vitest";

import type { JobInfo } from "@/service";
import { applyListActions } from "@/components/common/listActions";
import {
  createJobFilterCategories,
  createJobListActionsConfig,
  defaultJobSortDirection,
  defaultJobSortId,
  jobMatchesSearch,
  processFilterId,
} from "./jobListActions";

const jobs: JobInfo[] = [
  {
    jobID: "job-2",
    processID: "buffer",
    type: "process",
    status: "running",
    message: "Halfway there",
    progress: 50,
    created: "2026-01-02T00:00:00Z",
    updated: "2026-01-02T00:10:00Z",
  },
  {
    jobID: "job-1",
    processID: "clip",
    type: "process",
    status: "successful",
    message: "Done",
    created: "2026-01-01T00:00:00Z",
    finished: "2026-01-01T00:05:00Z",
  },
  {
    jobID: "job-3",
    processID: "area",
    type: "process",
    status: "failed",
    message: "Crashed",
    created: "2026-01-03T00:00:00Z",
    "x-traceback": ["Traceback", "AreaError"],
  },
];

describe("job list actions", () => {
  it("matches search terms against job fields and traceback", () => {
    expect(jobMatchesSearch(jobs[0], "buffer")).toBe(true);
    expect(jobMatchesSearch(jobs[0], "halfway")).toBe(true);
    expect(jobMatchesSearch(jobs[2], "areaerror")).toBe(true);
    expect(jobMatchesSearch(jobs[1], "halfway")).toBe(false);
  });

  it("builds status process and details filter categories", () => {
    const categories = createJobFilterCategories(jobs, []);

    expect(categories.map((category) => category.id)).toEqual([
      "job-status",
      "job-process",
      "job-details",
    ]);
    expect(
      categories
        .find((category) => category.id === "job-process")
        ?.criteria.map((criterion) => criterion.label),
    ).toEqual(["area", "buffer", "clip"]);
  });

  it("keeps selected process filters even if absent from current jobs", () => {
    const categories = createJobFilterCategories(jobs.slice(0, 1), [
      processFilterId("clip"),
    ]);

    expect(
      categories
        .find((category) => category.id === "job-process")
        ?.criteria.map((criterion) => criterion.label),
    ).toEqual(["buffer", "clip"]);
  });

  it("applies search filters and default descending created sort", () => {
    const result = applyListActions(
      jobs,
      {
        searchTerm: "",
        filterIds: ["job-status-running", "job-status-failed"],
        sortId: defaultJobSortId,
        sortDirection: defaultJobSortDirection,
      },
      createJobListActionsConfig(jobs, []),
    );

    expect(result.map((job) => job.jobID)).toEqual(["job-3", "job-2"]);
  });
});
