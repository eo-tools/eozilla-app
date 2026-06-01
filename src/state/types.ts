import {
  isServiceProviderId,
  type JobInfo,
  type ProcessRequest,
  type Service,
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

export interface ProcessExecution {
  processId: string;
  processRequest: ProcessRequest;
  jobInfo?: JobInfo;
  submitting?: boolean;
  error?: unknown;
}

export type DialogId = "service" | "traceback" | "job-result";

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
  processExecution?: ProcessExecution;
}

export function createInitialAppState(): AppState {
  const serviceProviderSelection = storage.serviceProviderSelection.get();
  let serviceProviderId = serviceProviderSelection?.providerId ?? null;
  if (!serviceProviderId || !isServiceProviderId(serviceProviderId)) {
    serviceProviderId = null;
  }
  return {
    serviceProviderId,
    service: null,
    dialogId: !serviceProviderId ? "service" : null,
    processesInputs: {},
    processId: undefined,
    jobId: undefined,
  };
}
