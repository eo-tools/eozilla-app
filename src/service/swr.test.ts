import { describe, expect, it, vi } from "vitest";
import type { JobInfo } from "./models";
import type { Service } from "./service";

vi.mock("swr", () => ({
  mutate: vi.fn(),
}));

import { mutate } from "swr";
import { invalidateSWRKeys, matchSWRKey, swrKeys } from "./swr";

describe("swr key helpers", () => {
  it("builds keys for available resources", () => {
    const service = { providerId: "custom" } as Service;
    const jobInfo = {
      jobID: "job-1",
      processID: "process-1",
      type: "process",
      status: "successful",
    } as JobInfo;

    expect(swrKeys.service("custom")).toEqual(["service", "custom"]);
    expect(swrKeys.processList(service)).toEqual(["processList", "custom"]);
    expect(swrKeys.processDescription(service, "process-1")).toEqual([
      "processDescription",
      "custom",
      "process-1",
    ]);
    expect(swrKeys.jobResults(service, jobInfo)).toEqual([
      "jobResults",
      "custom",
      "job-1",
    ]);
    expect(swrKeys.jobResults(service, { ...jobInfo, status: "running" })).toBeNull();
  });

  it("matches keys by the requested selector", () => {
    expect(
      matchSWRKey(["jobInfo", "custom", "job-1"], {
        resourceId: "jobInfo",
      }),
    ).toBe(true);
    expect(
      matchSWRKey(["jobInfo", "custom", "job-1"], {
        serviceProviderId: "custom",
      }),
    ).toBe(true);
    expect(
      matchSWRKey(["jobInfo", "custom", "job-1"], {
        processId: "job-1",
      }),
    ).toBe(true);
    expect(
      matchSWRKey(["jobInfo", "custom", "job-1"], {
        jobId: "job-1",
      }),
    ).toBe(true);
  });

  it("delegates invalidation to swr mutate", () => {
    const mockedMutate = vi.mocked(mutate);
    mockedMutate.mockImplementation((predicate: any) => predicate([
      "jobInfo",
      "custom",
      "job-1",
    ]));

    expect(
      invalidateSWRKeys({ resourceId: "jobInfo", serviceProviderId: "custom" }),
    ).toBe(true);
    expect(mockedMutate).toHaveBeenCalledTimes(1);
  });
});
