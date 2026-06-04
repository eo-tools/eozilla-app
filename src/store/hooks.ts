import { useEffect, useMemo } from "react";
import useSWR from "swr";

import { swrKeys } from "@/service/swr";
import { getAppState, getAppStore } from "@/store/store";
import type {
  AppState,
  DialogId,
  ProcessInputs,
  ProcessOutputs,
} from "@/state/types";
import {
  getServiceProvider,
  getServiceProviders,
  type ProcessDescription,
} from "@/service";
import { createJsonValueForSchema } from "@/utils/json";
import { getSchemaFromProcessDescriptionInputs } from "@/utils/field";
import {
  activateJob,
  activateProcess,
  openDialog,
  setInitialProcessInputs,
  setInitialProcessOutputs,
  setService,
} from "@/store/actions";
import { storage } from "@/state/storage";

const selectServiceProviderId = (state: AppState) => state.serviceProviderId;
const selectService = (state: AppState) => state.service;
const selectProcessId = (state: AppState) => state.processId;
const selectProcessesInputs = (state: AppState) => state.processesInputs;
const selectProcessesOutputs = (state: AppState) => state.processesOutputs;
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
      const storedSelection = storage.serviceProviderSelection.get();
      const options =
        storedSelection && storedSelection.id === serviceProviderId
          ? storedSelection.options
          : {};
      return await serviceProvider.createService(options);
    },
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

function getInitialProcessInputs(
  processDescription: ProcessDescription,
): ProcessInputs {
  const objectSchema =
    getSchemaFromProcessDescriptionInputs(processDescription);
  const processInputs: ProcessInputs = {};
  const properties = objectSchema.properties || {};
  Object.keys(properties).forEach((key) => {
    processInputs[key] = createJsonValueForSchema(properties[key]!);
  });
  return processInputs;
}

export function useActiveProcessInputs(): ProcessInputs | null {
  const activeProcessState = useActiveProcessDescription();
  const processesInputs = useAppState(selectProcessesInputs);
  const processDescription = activeProcessState.processDescription;
  return useMemo(() => {
    if (!processDescription) {
      return null;
    }
    const processId = processDescription.id;
    const processInputs = processesInputs[processId];
    if (processInputs) {
      return processInputs;
    }
    return getInitialProcessInputs(processDescription);
  }, [processesInputs, processDescription]);
}

export function useActiveProcessOutputs(): ProcessOutputs | null {
  const activeProcessState = useActiveProcessDescription();
  const processesOutputs = useAppState(selectProcessesOutputs);
  const processDescription = activeProcessState.processDescription;
  return useMemo(() => {
    if (!processDescription) {
      return null;
    }
    const processId = processDescription.id;
    const processOutputs = processesOutputs[processId];
    if (processOutputs) {
      return processOutputs;
    }
    return {};
  }, [processesOutputs, processDescription]);
}

export function useActiveJobId() {
  return useAppState(selectJobId);
}

// do not delete, we need it later
export function useConfirmation() {
  return useAppState(selectConfirmation);
}

// do not delete, we need it later
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
  const activeProcessId = useActiveProcessId();
  const service = useService();
  const processesState = useSWR(
    swrKeys.processDescription(service, activeProcessId),
    async () => await service!.getProcess(activeProcessId!),
  );
  const processDescription = processesState.data;
  // Ensure we have initial input values
  useEffect(() => {
    if (processDescription) {
      setInitialProcessInputs(processDescription);
      setInitialProcessOutputs(processDescription);
    }
  }, [processDescription]);
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
      refreshInterval: 500 /*ms*/,
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
