import { afterEach, describe, expect, it, vi } from "vitest";

import { TestingService } from "./testing";

describe("TestingService", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("exposes the L3B process and completes a job with progress", async () => {
    vi.useFakeTimers();
    const service = new TestingService(0, 5000);

    const processes = await service.getProcesses();
    expect(processes.processes.map((process) => process.id)).toEqual(["218"]);

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
    expect(process).not.toHaveProperty("fn");

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

    await vi.advanceTimersByTimeAsync(2500);
    await expect(service.getJob(acceptedJob.jobID)).resolves.toMatchObject({
      status: "running",
      progress: 50,
      message: "Started processing",
    });

    await vi.advanceTimersByTimeAsync(2500);
    await expect(service.getJob(acceptedJob.jobID)).resolves.toMatchObject({
      status: "successful",
      progress: 100,
      message: "Ended processing",
    });

    const results = await service.getJobResults(acceptedJob.jobID);
    const resultUri = results.return_value;
    expect(typeof resultUri).toBe("string");
    expect(
      JSON.parse(decodeURIComponent((resultUri as string).split(",")[1]!)),
    ).toEqual({
      start_date: "2026-01-01",
      end_date: "2026-01-31",
      geometry: "POINT (7 50)",
      indicator_name: "NDVI",
    });
  });

  it("dismisses a running job and keeps results unavailable", async () => {
    vi.useFakeTimers();
    const service = new TestingService(0, 5000);
    const job = await service.executeProcess("218", { inputs: {} });

    await vi.advanceTimersByTimeAsync(1000);
    await service.dismissJob(job.jobID);
    await vi.advanceTimersByTimeAsync(5000);

    await expect(service.getJob(job.jobID)).resolves.toMatchObject({
      status: "dismissed",
      progress: 20,
      message: "Processing dismissed",
    });
    await expect(service.getJobResults(job.jobID)).rejects.toMatchObject({
      apiError: { status: 403 },
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
