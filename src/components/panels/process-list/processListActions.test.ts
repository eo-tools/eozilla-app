import { describe, expect, it } from "vitest";

import type { ProcessSummary } from "@/service";
import { applyListActions } from "@/components/common/listActions";
import {
  defaultProcessSortDirection,
  defaultProcessSortId,
  processFilterCategories,
  processListActionsConfig,
  processMatchesSearch,
  processSortCriteria,
} from "./processListActions";

const processes: ProcessSummary[] = [
  {
    id: "buffer",
    version: "2.0.0",
    title: "Buffer",
    description: "Creates distance polygons",
    jobControlOptions: ["async-execute", "dismiss"],
    outputTransmission: ["reference"],
    keywords: ["geometry"],
    links: [{ href: "https://example.com/buffer" }],
  },
  {
    id: "clip",
    version: "1.0.0",
    title: "Clip",
    description: "Cuts one layer with another",
    jobControlOptions: ["sync-execute"],
    outputTransmission: ["value"],
  },
  {
    id: "area",
    version: "1.5.0",
    title: "Area",
    description: "",
    jobControlOptions: ["async-execute"],
    outputTransmission: ["value", "reference"],
  },
];

describe("process list actions", () => {
  it("matches search terms against id title and description", () => {
    expect(processMatchesSearch(processes[0], "buffer")).toBe(true);
    expect(processMatchesSearch(processes[1], "clip")).toBe(true);
    expect(processMatchesSearch(processes[1], "layer")).toBe(true);
    expect(processMatchesSearch(processes[2], "distance")).toBe(false);
  });

  it("defines job control output and metadata filter categories", () => {
    expect(processFilterCategories.map((category) => category.id)).toEqual([
      "job-control",
      "output-transmission",
      "metadata",
    ]);
  });

  it("filters with OR within categories and AND across categories", () => {
    const result = applyListActions(
      processes,
      {
        searchTerm: "",
        filterIds: [
          "process-job-control-sync",
          "process-job-control-async",
          "process-output-reference",
        ],
        sortId: defaultProcessSortId,
        sortDirection: defaultProcessSortDirection,
      },
      processListActionsConfig,
    );

    expect(result.map((process) => process.id)).toEqual(["area", "buffer"]);
  });

  it("sorts by title and falls back to process id", () => {
    const sortCriterion = processSortCriteria.find(
      (criterion) => criterion.id === "process-title",
    );
    expect(sortCriterion).toBeDefined();

    const sorted = [...processes]
      .sort(sortCriterion!.compare)
      .map((process) => process.id);

    expect(sorted).toEqual(["area", "buffer", "clip"]);
  });
});
