import { mutate } from "swr";

import type { Optional } from "@/utils/common";
import type { JobInfo } from "./models";
import type { Service } from "./service";

export type SWRKey =
  | readonly ["service", string]
  | readonly ["processList", string]
  | readonly ["processDescription", string, string]
  | readonly ["jobList", string]
  | readonly ["jobInfo", string, string]
  | readonly ["jobResults", string, string];

export const swrKeys = {
  service: (providerId: Optional<string>): SWRKey | null =>
    providerId ? (["service", providerId] as const) : null,

  processList: (service: Optional<Service>): SWRKey | null =>
    service ? (["processList", service.providerId] as const) : null,

  processDescription: (
    service: Optional<Service>,
    processId: Optional<string>,
  ): SWRKey | null =>
    service && processId
      ? (["processDescription", service.providerId, processId] as const)
      : null,

  jobList: (service: Optional<Service>): SWRKey | null =>
    service ? (["jobList", service.providerId] as const) : null,

  jobInfo: (
    service: Optional<Service>,
    jobId: Optional<string>,
  ): SWRKey | null =>
    service && jobId ? (["jobInfo", service.providerId, jobId] as const) : null,

  jobResults: (
    service: Optional<Service>,
    jobInfo: Optional<JobInfo>,
  ): SWRKey | null =>
    service && jobInfo?.status === "successful"
      ? (["jobResults", service.providerId, jobInfo!.jobID] as const)
      : null,
};

export type SWRKeyOptions =
  | {
      resourceId?:
        | "service"
        | "processList"
        | "processDescription"
        | "jobList"
        | "jobInfo"
        | "jobResults";
    }
  | {
      serviceProviderId?: string;
    }
  | {
      processId?: string;
    }
  | {
      jobId?: string;
    };

export function matchSWRKey(key: SWRKey, options: SWRKeyOptions): boolean {
  const opt = options as Record<string, string>;
  return Boolean(
    Array.isArray(key) &&
    ((opt.resourceId && key[0] === opt.resourceId) ||
      (opt.serviceProviderId && key[1] === opt.serviceProviderId) ||
      (opt.processId && key[2] === opt.processId) ||
      (opt.jobId && key[2] === opt.jobId)),
  );
}

export function invalidateSWRKeys(options: SWRKeyOptions) {
  // invalidate all keys for FileSystemProvider
  // BEFORE changing the app store
  return mutate((key: SWRKey) => matchSWRKey(key, options));
}
