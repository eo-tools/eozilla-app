import {
  isServiceProviderId,
  type JobInfo,
  type ProcessRequest,
  type Service,
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

export interface ProcessExecution {
  processId: string;
  processRequest: ProcessRequest;
  jobInfo?: JobInfo;
  submitting?: boolean;
  error?: unknown;
}

export type DialogId = "service" | "traceback" | "job-result" | "privacy";

export type ProcessEditorMode = "form" | "json";

export interface AppState {
  serviceProviderId: string | null;
  service: Service | null;
  processEditorMode: ProcessEditorMode;
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
  let serviceProviderId = storage.hasServiceProviderSelection()
    ? (serviceProviderSelection?.id ?? null)
    : null;
  if (!serviceProviderId || !isServiceProviderId(serviceProviderId)) {
    serviceProviderId = null;
  }
  return {
    serviceProviderId,
    service: null,
    processEditorMode: "form",
    dialogId: !serviceProviderId ? "service" : null,
    processId: undefined,
    processRequests: {},
    jobId: undefined,
  };
}
