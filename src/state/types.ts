import {
  isServiceProviderId,
  type Output,
  type JobInfo,
  type Service,
  type ProcessRequest,
} from "@/service";
import { type JsonValue } from "@/utils/json";
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

export type ProcessInputs = Record<string, JsonValue>;
export type ProcessesInputs = Record<string, ProcessInputs>;
export type ProcessOutputs = Record<string, Output>;
export type ProcessesOutputs = Record<string, ProcessOutputs>;

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
  jobId?: string;
  dialogId: DialogId | null;
  dialogData?: unknown;
  confirmation?: ConfirmationData;
  information?: InformationData;
  processesInputs: ProcessesInputs;
  processesOutputs: ProcessesOutputs;
  processExecution?: ProcessExecution;
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
    processesInputs: {},
    processesOutputs: {},
    processId: undefined,
    jobId: undefined,
  };
}
