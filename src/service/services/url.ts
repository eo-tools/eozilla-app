import type {
  ApiError,
  JobInfo,
  JobList,
  JobResults,
  ProcessDescription,
  ProcessList,
  ProcessRequest,
  Service,
  ServiceMetadata,
  UserIdentity,
} from "@/service";
import { isObject } from "@/utils/common";
import { ServiceError } from "@/service/errors";

interface ApiCallOptions<T> {
  params?: [string, string][];
  method?: string;
  data?: unknown;
  validate?: (data: unknown) => T;
}

export class UrlService implements Service {
  readonly providerId: string;
  readonly apiUrl: string;
  readonly user: UserIdentity;
  readonly root: ServiceMetadata;

  constructor(
    providerId: string,
    apiUrl: string,
    user: UserIdentity,
    root: ServiceMetadata,
  ) {
    this.providerId = providerId;
    this.apiUrl = apiUrl;
    this.user = user;
    this.root = root;
  }

  async getProcesses(): Promise<ProcessList> {
    return await this.callApi(["processes"], {
      validate: validateProcessList,
    });
  }

  async getProcess(processId: string): Promise<ProcessDescription> {
    return await this.callApi(["processes", processId], {
      validate: validateProcessDescription,
    });
  }

  async executeProcess(
    processId: string,
    processRequest: ProcessRequest,
  ): Promise<JobInfo> {
    return await this.callApi(["processes", processId, "execution"], {
      method: "post",
      data: processRequest,
      validate: validateJobInfo,
    });
  }

  async getJobs(): Promise<JobList> {
    return await this.callApi(["jobs"], { validate: validateJobList });
  }

  async getJob(jobId: string): Promise<JobInfo> {
    return await this.callApi(["jobs", jobId], {
      validate: validateJobInfo,
    });
  }

  async dismissJob(jobId: string): Promise<void> {
    return await this.callApi<void>(["jobs", jobId], { method: "delete" });
  }

  async getJobResults(jobId: string): Promise<JobResults> {
    return await this.callApi(["jobs", jobId, "results"], {
      validate: validateJobResults,
    });
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }

  private async callApi<T>(
    path: string[] = [],
    options?: ApiCallOptions<T>,
  ): Promise<T> {
    return await callApi(this.apiUrl, path, options);
  }
}

export async function loadServiceRootMetadata(
  apiUrl: string,
): Promise<ServiceMetadata> {
  return await callApi(apiUrl, [], { validate: validateServiceMetadata });
}

function validateProcessList(data: unknown): ProcessList {
  // TODO: validate data is ProcessList
  return data as ProcessList;
}

function validateProcessDescription(data: unknown): ProcessDescription {
  // TODO: validate data is ProcessDescription
  return data as ProcessDescription;
}

function validateJobList(data: unknown): JobList {
  // TODO: validate data is JobList
  return data as JobList;
}

function validateJobInfo(data: unknown): JobInfo {
  // TODO: validate data is JobInfo
  return data as JobInfo;
}

function validateJobResults(data: unknown): JobResults {
  // TODO: validate data is JobResults
  return data as JobResults;
}

function validateServiceMetadata(data: unknown): ServiceMetadata {
  // TODO: validate data is ServiceMetadata
  return data as ServiceMetadata;
}

async function callApi<T>(
  apiUrl: string,
  path: string[] = [],
  options?: ApiCallOptions<T>,
): Promise<T> {
  const url = buildUrl(apiUrl, path, options?.params || []);
  const response = await fetch(url, {
    method: options?.method,
    headers:
      typeof options?.data !== "undefined"
        ? { "Content-Type": "application/json" }
        : undefined,
    body:
      typeof options?.data !== "undefined"
        ? JSON.stringify(options.data)
        : undefined,
  });
  const returnValue = await response.json();
  if (isApiError(returnValue)) {
    throw new ServiceError(returnValue);
  }
  if (!response.ok) {
    throw new HttpError(response);
  }
  if (options?.validate) {
    return options?.validate(returnValue);
  }
  return returnValue as T;
}

function isApiError(data: unknown): data is ApiError {
  return (
    isObject(data) &&
    "type" in data &&
    typeof data["type"] === "string" &&
    "status" in data &&
    typeof data["status"] === "number"
  );
}

class HttpError extends Error {
  readonly response: Response;
  constructor(response: Response) {
    super(response.statusText || `HTTP error ${response.status}`);
    this.response = response;
  }
}

const buildUrl = (
  baseUrl: string,
  paths: string[] = [],
  params: [string, string][] = [],
): string => {
  const url = new URL(paths.map(encodeURIComponent).join("/"), baseUrl);
  params.forEach(([k, v]) => url.searchParams.append(k, v));
  return url.toString();
};
