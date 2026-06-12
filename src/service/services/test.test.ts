import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("TestService", () => {
  let TestService: typeof import("./test").TestService;

  beforeEach(async () => {
    vi.resetModules();
    ({ TestService } = await import("./test"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("provides processes and executes jobs", async () => {
    const service = new TestService(0);

    const processes = await service.getProcesses();

    expect(processes.processes.map((process) => process.id)).toEqual([
      "p1",
      "p2",
    ]);

    const process = await service.getProcess("p1");

    expect(process.id).toBe("p1");
    expect(process).not.toHaveProperty("fn");

    const setIntervalSpy = vi
      .spyOn(globalThis, "setInterval")
      .mockImplementation(((callback: TimerHandler) => {
        if (typeof callback === "function") {
          for (let i = 0; i < 10; i += 1) {
            callback(0);
          }
        }
        return 1 as unknown as number;
      }) as typeof setInterval);

    const job = await service.executeProcess("p1", { inputs: { answer: 42 } });

    expect(job.status).toBe("successful");
    expect(job.processID).toBe("p1");

    await expect(service.getJobResults(job.jobID)).resolves.toEqual({
      returnValue: 42,
    });

    expect(setIntervalSpy).toHaveBeenCalled();
  });

  it("rejects unknown process ids with a service error", async () => {
    const service = new TestService(0);

    await expect(service.getProcess("missing")).rejects.toMatchObject({
      apiError: {
        status: 404,
        title: "Process 'missing' not found",
      },
    });
  });
});
