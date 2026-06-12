import {
  isServiceProviderId,
  type JobInfo,
  type Service,
  type ProcessRequest,
} from "@/service";
import { storage } from "@/state/storage";

export interface ConfirmationData {
  title: string;
  text: string;
  options: Array<{
    id: string;
    label: string;
    danger?: boolean;
    onClick?: () => void;
  }>;
}

export interface InformationData {
  title: string;
  text: string;
  error?: unknown;
}

/**
 * A request for a process execution for a known process.
 */
export interface ExecutionRequest extends ProcessRequest {
  /** The process ID.*/
  processId: string;
}

export interface ProcessExecution {
  request: ExecutionRequest;
  jobInfo?: JobInfo;
  submitting?: boolean;
  error?: unknown;
}

export type DialogId = "service" | "traceback" | "job-result" | "privacy";

export interface AppState {
  serviceProviderId: string | null;
  service: Service | null;
  processId?: string;
  processRequests: Record<string, ProcessRequest>;
  processExecution?: ProcessExecution;
  jobId?: string;
  dialogId: DialogId | null;
  dialogData?: unknown;
  confirmation?: ConfirmationData;
  information?: InformationData;
}

export function createInitialAppState(): AppState {
  const serviceProviderSelection = storage.serviceProviderSelection.get();
  let serviceProviderId = serviceProviderSelection?.id ?? null;
  if (!serviceProviderId || !isServiceProviderId(serviceProviderId)) {
    serviceProviderId = null;
  }
  return {
    serviceProviderId,
    service: null,
    dialogId: !serviceProviderId ? "service" : null,
    processId: undefined,
    processRequests: {},
    jobId: undefined,
  };
}
