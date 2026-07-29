import { useCallback, useEffect, useMemo } from "react";
import useSWR from "swr";

import {
  type ProcessInputs,
  type ProcessOutputs,
  getServiceProvider,
  getServiceProviders,
  type ProcessRequest,
  type Input,
  type Output,
} from "@/service";
import { swrKeys } from "@/service/swr";
import { getAppState, getAppStore } from "@/store/store";
import type { AppState, DialogId } from "@/state/types";

import {
  activateJob,
  activateProcess,
  openDialog,
  setService,
} from "@/store/actions";
import { storage } from "@/state/storage";
import { useRemoteStateClient, useRemoteStateValue } from "remotestate";
import type { ProcessRequestsService } from "@/store/remotestate";
import {
  createInitialProcessInputs,
  createInitialProcessOutputs,
  ensureInitialProcessRequest,
} from "@/store/processRequests";

const selectServiceProviderId = (state: AppState) => state.serviceProviderId;
const selectService = (state: AppState) => state.service;
const selectProcessId = (state: AppState) => state.processId;
const selectProcessEditorMode = (state: AppState) => state.processEditorMode;
const selectProcessExecution = (state: AppState) => state.processExecution;
const selectJobId = (state: AppState) => state.jobId;
const selectConfirmation = (state: AppState) => state.confirmation;
const selectInformation = (state: AppState) => state.information;

export const useAppState = <T>(selector: (state: AppState) => T) =>
  getAppStore()(selector);

export function useLoadService() {
  const serviceProviderId = useAppState(selectServiceProviderId);

  const serviceState = useSWR(
    serviceProviderId ? swrKeys.service(serviceProviderId) : null,
    async () => {
      if (!serviceProviderId) {
        return null;
      }
      const serviceProvider = getServiceProvider(serviceProviderId);
      const options = storage.getServiceProviderOptions(serviceProviderId);
      return await serviceProvider.createService(options);
    },
    serviceProviderId === "testing" || serviceProviderId === "custom"
      ? {
          revalidateOnFocus: false,
          revalidateOnReconnect: false,
          revalidateIfStale: false,
        }
      : undefined,
  );

  // Sync state if the service changes
  const nextService = serviceState.data || null;
  const prevService = getAppState().service;
  useEffect(() => {
    if (prevService !== nextService) {
      setService(nextService);
    }
  }, [prevService, nextService]);

  useEffect(() => {
    if (serviceState.error && serviceProviderId) {
      openDialog("service");
    }
  }, [serviceProviderId, serviceState.error]);

  return { ...serviceState, service: nextService };
}

export function useServiceProviderId() {
  return useAppState(selectServiceProviderId);
}

export function useServiceProviders() {
  return getServiceProviders();
}

export function useService() {
  return useAppState(selectService);
}

export function useActiveProcessId() {
  return useAppState(selectProcessId);
}

export function useProcessEditorMode() {
  return useAppState(selectProcessEditorMode);
}

export function useProcessRequests() {
  return useRemoteStateValue<Record<string, ProcessRequest>>("processRequests");
}

export function useSetProcessRequest() {
  const client = useRemoteStateClient<ProcessRequestsService>();
  return useCallback(
    (processId: string, processRequest: ProcessRequest) => {
      client.store.set(["processRequests", processId], processRequest);
    },
    [client],
  );
}

export function useActiveProcessRequestsActions() {
  const client = useRemoteStateClient<ProcessRequestsService>();
  const processId = useActiveProcessId();
  const setProcessRequestInput = useCallback(
    (name: string, value: Input) => {
      if (processId) {
        client.store.set(["processRequests", processId, "inputs", name], value);
      }
    },
    [client, processId],
  );
  const setProcessRequestOutput = useCallback(
    (name: string, value: Output | undefined) => {
      if (processId) {
        client.store.set(
          ["processRequests", processId, "outputs", name],
          value,
        );
      }
    },
    [client, processId],
  );
  return {
    setProcessRequestInput,
    setProcessRequestOutput,
  };
}

export function useActiveProcessInputs(): ProcessInputs | null {
  const processRequests = useProcessRequests();
  const activeProcessState = useActiveProcessDescription();
  const processDescription = activeProcessState.processDescription;
  return useMemo(() => {
    if (!processDescription || !processRequests) {
      return null;
    }
    const processId = processDescription.id;
    const processInputs = processRequests[processId]?.inputs;
    if (processInputs) {
      return processInputs;
    }
    return createInitialProcessInputs(processDescription);
  }, [processRequests, processDescription]);
}

export function useActiveProcessOutputs(): ProcessOutputs | null {
  const processRequests = useProcessRequests();
  const activeProcessState = useActiveProcessDescription();
  const processDescription = activeProcessState.processDescription;
  return useMemo(() => {
    if (!processDescription || !processRequests) {
      return null;
    }
    const processId = processDescription.id;
    const processOutputs = processRequests[processId]?.outputs;
    if (processOutputs) {
      return processOutputs;
    }
    return createInitialProcessOutputs(processDescription);
  }, [processRequests, processDescription]);
}

export function useActiveJobId() {
  return useAppState(selectJobId);
}

// do not delete, we need it later
// noinspection JSUnusedGlobalSymbols
export function useConfirmation() {
  return useAppState(selectConfirmation);
}

// do not delete, we need it later
// noinspection JSUnusedGlobalSymbols
export function useInformation() {
  return useAppState(selectInformation);
}

export function useProcessList() {
  const service = useService();
  const processesState = useSWR(
    swrKeys.processList(service),
    async () => await service?.getProcesses(),
  );
  const processList = processesState.data;
  useEffect(() => {
    if (processList?.processes?.length) {
      activateProcess(processList.processes[0].id);
    }
  }, [processList]);
  return { ...processesState, processList, service };
}
export function useProcessExecution() {
  return useAppState(selectProcessExecution);
}

export function useActiveProcessDescription() {
  const setProcessRequest = useSetProcessRequest();
  const activeProcessId = useActiveProcessId();
  const processRequests = useProcessRequests();
  const service = useService();
  const processesState = useSWR(
    swrKeys.processDescription(service, activeProcessId),
    async () => await service!.getProcess(activeProcessId!),
  );
  const processDescription = processesState.data;
  // Ensure we have initial input values
  useEffect(() => {
    if (processDescription && processRequests) {
      const processId = processDescription.id;
      const processRequest = ensureInitialProcessRequest(
        processRequests,
        processDescription,
      );
      if (processRequest !== processRequests[processId]) {
        setProcessRequest(processId, processRequest);
      }
    }
  }, [processDescription, processRequests, setProcessRequest]);
  return {
    ...processesState,
    processDescription,
    service,
  };
}

export function useJobList() {
  const service = useService();
  const jobsState = useSWR(
    swrKeys.jobList(service),
    async () => await service?.getJobs(),
    {
      // TODO: make configurable
      refreshInterval: 1000 /*ms*/,
    },
  );
  const jobList = jobsState.data;
  useEffect(() => {
    // check if activeJobId is still in the list of jobList
    const activeJobId = getAppState().jobId;
    if (jobList && jobList.jobs && activeJobId) {
      const activeJobInfo = jobList.jobs.find(
        (jobInfo) => jobInfo.jobID === activeJobId,
      );
      if (!activeJobInfo) {
        activateJob(null);
      }
    }
  }, [jobList]);
  return { ...jobsState, jobList, service };
}

export function useActiveJobInfo() {
  const service = useService();
  const activeJobId = useActiveJobId();
  const jobInfoState = useSWR(
    swrKeys.jobInfo(service, activeJobId),
    async () => await service!.getJob(activeJobId!),
    {
      // TODO: make configurable
      refreshInterval: 1000 /*ms*/,
    },
  );
  const jobInfo = jobInfoState.data;
  return { ...jobInfoState, jobInfo, service };
}

export function useActiveJobResults() {
  const service = useService();
  const { jobInfo } = useActiveJobInfo();
  const jobResultsState = useSWR(
    swrKeys.jobResults(service, jobInfo),
    async () => await service!.getJobResults(jobInfo!.jobID),
  );
  const jobResults = jobResultsState.data;
  return { ...jobResultsState, jobResults, jobInfo, service };
}

export function useDialogOpened(dialogId: DialogId) {
  return useAppState((state: AppState) => state.dialogId === dialogId);
}
