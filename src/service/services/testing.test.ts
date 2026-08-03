import { afterEach, describe, expect, it, vi } from "vitest";

import { TestingService } from "./testing";

describe("TestingService", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exposes the L3B process and completes a job with progress", async () => {
    vi.useFakeTimers();
    const service = new TestingService(0);

    const process = await service.getProcess("218");
    expect(process).toMatchObject({
      id: "218",
      title: "L3B AOI Indicators Processor",
      version: "5.0.4",
    });
    expect(process.inputs.geometry.schema).toMatchObject({
      type: "string",
      format: "wkt",
      "x-ui-widget": "map",
      "x-ui-order": 20,
    });
    expect(process.inputs.indicator_name.schema).toMatchObject({
      enum: ["NDVI", "LAI", "FAPAR", "FCOVER", "NDWI"],
      nullable: true,
      "x-ui-widget": "radio",
      "x-ui-advanced": true,
    });

    const inputs = {
      start_date: "2026-01-01",
      end_date: "2026-01-31",
      geometry: "POINT (7 50)",
      indicator_name: "NDVI",
      site_extend: null,
    };
    const acceptedJob = await service.executeProcess("218", { inputs });

    expect(acceptedJob).toMatchObject({
      processID: "218",
      status: "accepted",
      progress: 0,
      message: "Accepted for processing",
    });

    await expect(service.getJob(acceptedJob.jobID)).resolves.toMatchObject({
      status: "successful",
      message: "Ended processing",
    });

    const results = await service.getJobResults(acceptedJob.jobID);
    expect(results.return_value).toEqual({
      start_date: "2026-01-01",
      end_date: "2026-01-31",
      geometry: "POINT (7 50)",
      indicator_name: "NDVI",
    });
  });

  it("simulates the sleep processor and fails midway when requested", async () => {
    vi.useFakeTimers();
    const service = new TestingService(0);

    const acceptedJob = await service.executeProcess("sleep_a_while", {
      inputs: {
        duration: 1,
        fail: true,
      },
    });

    expect(acceptedJob).toMatchObject({
      processID: "sleep_a_while",
      status: "accepted",
      progress: 0,
      message: "Accepted for processing",
    });

    await vi.advanceTimersByTimeAsync(500);
    await expect(service.getJob(acceptedJob.jobID)).resolves.toMatchObject({
      status: "failed",
      progress: 50,
      message: "Woke up too early",
    });
    await expect(
      service.getJobResults(acceptedJob.jobID),
    ).rejects.toMatchObject({
      apiError: { status: 403 },
    });
  });

  it("simulates the sleep processor and returns the effective sleep time", async () => {
    vi.useFakeTimers();
    const service = new TestingService(0);

    const acceptedJob = await service.executeProcess("sleep_a_while", {
      inputs: {
        duration: 1,
        fail: false,
      },
    });

    await vi.advanceTimersByTimeAsync(1000);

    await expect(service.getJob(acceptedJob.jobID)).resolves.toMatchObject({
      status: "successful",
      progress: 100,
      message: "Ended processing",
    });

    const results = await service.getJobResults(acceptedJob.jobID);
    expect(results.return_value).toBeCloseTo(1, 5);
  });

  it("dismisses a running job and keeps results unavailable", async () => {
    vi.useFakeTimers();
    const service = new TestingService(0);
    const job = await service.executeProcess("sleep_a_while", {
      inputs: { duration: 1, fail: false },
    });

    await vi.advanceTimersByTimeAsync(500);
    await service.dismissJob(job.jobID);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(service.getJob(job.jobID)).resolves.toMatchObject({
      status: "dismissed",
      message: "Processing dismissed",
    });
    await expect(service.getJobResults(job.jobID)).rejects.toMatchObject({
      apiError: { status: 403 },
    });
  });

  it("restarts failed jobs with their original request", async () => {
    vi.useFakeTimers();
    const service = new TestingService(0);
    const failedJob = await service.executeProcess("sleep_a_while", {
      inputs: { duration: 1, fail: true },
    });

    await vi.advanceTimersByTimeAsync(500);
    const restartedJob = await service.restartJob(failedJob.jobID);

    expect(restartedJob).toMatchObject({
      processID: "sleep_a_while",
      status: "accepted",
    });
    expect(restartedJob.jobID).not.toBe(failedJob.jobID);

    await vi.advanceTimersByTimeAsync(500);
    await expect(service.getJob(restartedJob.jobID)).resolves.toMatchObject({
      status: "failed",
      message: "Woke up too early",
    });
  });

  it("rejects unknown process and job ids with service errors", async () => {
    const service = new TestingService(0);

    await expect(service.getProcess("missing")).rejects.toMatchObject({
      apiError: {
        status: 404,
        title: "Process 'missing' not found",
      },
    });
    await expect(service.getJob("missing")).rejects.toMatchObject({
      apiError: {
        status: 404,
        title: "Job 'missing' not found",
      },
    });
  });
});
