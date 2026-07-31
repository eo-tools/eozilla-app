import { notifications } from "@mantine/notifications";

import { getAppState, setAppState } from "@/store/store";
import {
  type DialogId,
  type ProcessEditorMode,
  createInitialAppState,
} from "@/state/types";
import {
  type JobInfo,
  getServiceProvider,
  type ServiceOptions,
  type ServiceOptionsInput,
  type Service,
  type ProcessRequest,
} from "@/service";
import { invalidateSWRKeys } from "@/service/swr";
import { getErrorMessage, type Optional } from "@/utils/common";
import { storage } from "@/state/storage";

////////////////////////////////////////
// Common actions

export function openDialog(dialogId: DialogId, dialogData?: unknown) {
  setAppState({ dialogId, dialogData });
}

export function closeDialog() {
  setAppState({ dialogId: null, dialogData: undefined });
}

export function resetState() {
  storage.deleteServiceProviderSelection();
  const { service } = getAppState();
  if (service) {
    void service.close();
  }
  setAppState(createInitialAppState(), true);
}

export function copyJsonToClipboard(value: unknown) {
  navigator.clipboard
    .writeText(JSON.stringify(value, null, 2))
    .then(() => {
      notifications.show({
        message: "JSON copied to clipboard.",
      });
    })
    .catch((e) => {
      notifications.show({
        message: getErrorMessage(e),
        color: "red",
      });
    });
}

export function copyTextToClipboard(text: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      notifications.show({
        message: "Text copied to clipboard.",
      });
    })
    .catch((e) => {
      notifications.show({
        message: getErrorMessage(e),
        color: "red",
      });
    });
}

export function setProcessEditorMode(mode: ProcessEditorMode) {
  setAppState({ processEditorMode: mode });
}

////////////////////////////////////////
// Service actions

export async function signIn(
  serviceProviderId: string,
  options: ServiceOptionsInput<ServiceOptions>,
) {
  const provider = getServiceProvider(serviceProviderId);
  storage.saveServiceProviderSelection({
    id: serviceProviderId,
    options,
  });
  try {
    await provider.signIn(options);
    setAppState({ serviceProviderId });
  } catch (e) {
    storage.deleteServiceProviderSelection();
    console.error(e);
    throw e;
  }
  // Note, depending on the provider.signIn() action
  // the app execution ends here (e.g. due to a redirection).
}

export async function signOut() {
  storage.deleteServiceProviderSelection();
  const { service } = getAppState();
  if (!service) {
    return;
  }
  // invalidate all keys for ServiceProvider
  // BEFORE changing the app store
  const serviceProviderId = service.providerId;
  await invalidateSWRKeys({ serviceProviderId });
  try {
    const provider = getServiceProvider(serviceProviderId);
    await provider.signOut();
  } catch (e) {
    console.error(e);
  }
  // Note, depending on the provider.signOut() action
  // we might never arrive here (e.g. due to a redirection).
  resetState();
}

export function setService(service: Service | null) {
  setAppState({
    service,
    processId: undefined,
    jobId: undefined,
  });
}

////////////////////////////////////////
// Process actions

export function activateProcess(processId: Optional<string>) {
  setAppState({ processId: !processId ? undefined : processId });
}

export function executeActiveProcess(
  processRequests: Record<string, ProcessRequest>,
) {
  const { service, processId } = getAppState();
  if (!service || !processId || !processRequests[processId]) {
    return;
  }
  const processRequest = processRequests[processId];
  const processExecution = {
    processId,
    processRequest,
    submitting: true,
  };
  setAppState({ processExecution });
  service
    .executeProcess(processId, processRequest)
    .then((jobInfo) => {
      notifications.show({
        message: "Process request accepted.",
      });
      setAppState({
        processExecution: { ...processExecution, submitting: false, jobInfo },
        jobId: jobInfo.jobID,
      });
    })
    .catch((error: unknown) => {
      notifications.show({
        message: `Process request rejected: ${getErrorMessage(error)}`,
        color: "red",
      });
      setAppState({
        processExecution: { ...processExecution, submitting: false, error },
      });
    });
}

////////////////////////////////////////
// Job actions

export function activateJob(jobId: Optional<string>) {
  setAppState({ jobId: !jobId ? undefined : jobId });
}

export function dismissJob(jobId: string) {
  const { service } = getAppState();
  if (!service) {
    return;
  }
  service.dismissJob(jobId).then(() => {
    console.debug(`requested dismissal of job ${jobId}`);
  });
}

/** Whether a job can be submitted again from the jobs list. */
export function canRestartJob(jobInfo: JobInfo): boolean {
  return jobInfo.status === "failed" || jobInfo.status === "dismissed";
}

/** Ask the service to submit a failed or dismissed job again. */
export async function restartJob(jobInfo: JobInfo): Promise<void> {
  if (!canRestartJob(jobInfo)) {
    return;
  }

  const { service } = getAppState();
  if (!service) {
    return;
  }

  try {
    const restartedJob = await service.restartJob(jobInfo.jobID);
    notifications.show({
      message: "Job restart accepted.",
    });
    setAppState({
      processId: restartedJob.processID,
      jobId: restartedJob.jobID,
    });
  } catch (error: unknown) {
    notifications.show({
      message: `Job restart rejected: ${getErrorMessage(error)}`,
      color: "red",
    });
  }
}

////////////////////////////////////////////////////////////////////
// Helpers (should go into separate module)

/*
async function mutateData<T>(
  service: Service,
  path: string,
  key: SWRKey,
  mutateCache: (prev: T[]) => T[],
) {
  // Optimistic update, we do NOT await by intention!
  void mutate(key, (prevValue: T[] = []) => mutateCache(prevValue), {
    revalidate: false,
  });
  try {
    const currentArray = await persistence.readData<T>(
      service,
      path,
      key[0],
      true,
    );
    const nextArray = mutateCache(currentArray);
    await persistence.writeData(service, path, key[0], nextArray);
    return await mutate<T>(key); // revalidate
  } catch (e) {
    await mutate<T>(key); // rollback via revalidation
    throw e;
  }
}
*/

// Code to be reused later

/*
export function deleteCourseWithPrompt(course: Course) {
  requestConfirmation({
    title: "Delete Course",
    title: `Really delete course "${getProcessTitle(course)}"? This cannot be undone.`,
    options: [
      { service: "no", label: "No" },
      {
        service: "yes",
        label: "Yes",
        danger: true,
        onClick: () => void deleteCourse(course.service),
      },
    ],
  });
}

export async function deleteCourse(courseId: string) {
  try {
    await _deleteCourse(courseId);
  } finally {
    if (getAppState().processId === courseId) {
      deactivateCourse();
    }
  }
}

export function requestConfirmation(confirmation: ConfirmationData) {
  setAppState({ confirmation });
}

export function closeConfirmationBox() {
  setAppState({ confirmation: undefined });
}

export function showInformationBox(information: InformationData) {
  setAppState({ information });
}

export function closeInformationBox() {
  setAppState({ information: undefined });
}
*/
