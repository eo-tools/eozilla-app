import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { ServiceError } from "@/service/errors";
import { UrlService, loadServiceRootMetadata } from "./url";
import type {
  JobInfo,
  JobList,
  JobResults,
  ProcessDescription,
  ProcessList,
  ServiceMetadata,
} from "@/service";

function createJsonResponse<T>(
  data: T,
  init: { ok?: boolean; status?: number; statusText?: string } = {},
) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    json: async () => data,
  } as Response;
}

describe("UrlService", () => {
  const root: ServiceMetadata = {
    title: "API",
    description: "Test API",
  };

  const user = { id: "u1", displayName: "User" };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads root metadata from the API root", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(root));

    await expect(
      loadServiceRootMetadata("https://example.com/api/"),
    ).resolves.toEqual(root);
    expect(fetchMock).toHaveBeenCalledWith("https://example.com/api/", {
      method: undefined,
      headers: undefined,
      body: undefined,
    });
  });

  it("performs the public service operations", async () => {
    const service = new UrlService(
      "custom",
      "https://example.com/api/",
      user,
      root,
    );

    const processes: ProcessList = { processes: [], links: [] };
    const process: ProcessDescription = {
      id: "p1",
      version: "1.0.0",
      title: "Process 1",
      description: "Test process",
      inputs: {},
      outputs: {},
    };
    const job: JobInfo = {
      jobID: "j1",
      processID: "p1",
      type: "process",
      status: "accepted",
    };
    const jobs: JobList = { jobs: [job], links: [] };
    const results: JobResults = {
      output: { mediaType: "text/plain", value: "done" },
    };

    fetchMock
      .mockResolvedValueOnce(createJsonResponse(processes))
      .mockResolvedValueOnce(createJsonResponse(process))
      .mockResolvedValueOnce(createJsonResponse(job))
      .mockResolvedValueOnce(createJsonResponse(jobs))
      .mockResolvedValueOnce(createJsonResponse(job))
      .mockResolvedValueOnce(createJsonResponse(results))
      .mockResolvedValueOnce(createJsonResponse(undefined));

    await expect(service.getProcesses()).resolves.toEqual(processes);
    await expect(service.getProcess("p1")).resolves.toEqual(process);
    await expect(
      service.executeProcess("p1", { inputs: { answer: 42 } }),
    ).resolves.toEqual(job);
    await expect(service.getJobs()).resolves.toEqual(jobs);
    await expect(service.getJob("j1")).resolves.toEqual(job);
    await expect(service.getJobResults("j1")).resolves.toEqual(results);
    await expect(service.dismissJob("j1")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api/processes",
      expect.objectContaining({}),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api/processes/p1",
      expect.objectContaining({}),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api/processes/p1/execution",
      expect.objectContaining({
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: { answer: 42 } }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api/jobs/j1",
      expect.objectContaining({ method: "delete" }),
    );
  });

  it("throws a ServiceError when the API returns problem details", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        {
          type: "Not Found",
          status: 404,
          title: "Missing",
        },
        { ok: true, status: 200 },
      ),
    );

    await expect(
      loadServiceRootMetadata("https://example.com/api/"),
    ).rejects.toBeInstanceOf(ServiceError);
  });
});
