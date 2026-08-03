import { beforeEach, describe, expect, it, vi } from "vitest";

import type { JobInfo, Service } from "@/service";
import { canRestartJob, restartJob } from "./actions";
import { getAppState, initAppStore, setAppState } from "./store";

const { showNotification } = vi.hoisted(() => ({
  showNotification: vi.fn(),
}));

vi.mock("@mantine/notifications", () => ({
  notifications: { show: showNotification },
}));

vi.mock("@/state/storage", () => ({
  storage: {
    hasServiceProviderSelection: () => false,
    serviceProviderSelection: { get: () => null },
  },
}));

const failedJob: JobInfo = {
  jobID: "failed-job",
  processID: "sleep_a_while",
  type: "process",
  status: "failed",
};

function createService(): Service {
  return {
    providerId: "testing",
    user: { id: "test", displayName: "Test user" },
    meta: {},
    getProcesses: vi.fn(),
    getProcess: vi.fn(),
    executeProcess: vi.fn(),
    restartJob: vi.fn().mockResolvedValue({
      ...failedJob,
      jobID: "restarted-job",
      status: "accepted",
    }),
    getJobs: vi.fn(),
    getJob: vi.fn(),
    getJobResults: vi.fn(),
    dismissJob: vi.fn(),
    close: vi.fn(),
  };
}

describe("job restart actions", () => {
  beforeEach(() => {
    initAppStore(() => undefined);
    showNotification.mockClear();
  });

  it("allows failed and dismissed jobs to be restarted", () => {
    expect(canRestartJob(failedJob)).toBe(true);
    expect(canRestartJob({ ...failedJob, status: "dismissed" })).toBe(true);
    expect(canRestartJob({ ...failedJob, status: "running" })).toBe(false);
  });

  it("restarts a failed job through the service", async () => {
    const service = createService();
    setAppState({ service });

    await restartJob(failedJob);

    expect(service.restartJob).toHaveBeenCalledWith(failedJob.jobID);
    expect(getAppState()).toMatchObject({
      processId: failedJob.processID,
      jobId: "restarted-job",
    });
    expect(showNotification).toHaveBeenCalledWith({
      message: "Job restart accepted.",
    });
  });
});
