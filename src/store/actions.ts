import { notifications } from "@mantine/notifications";

import { getAppState, setAppState } from "@/store/store";
import { type DialogId, createInitialAppState } from "@/state/types";
import {
  getServiceProvider,
  type ServiceOptions,
  type ServiceOptionsInput,
  type Input,
  type Output,
  type ProcessDescription,
  type Service,
  type ProcessInputs,
  type ProcessOutputs,
} from "@/service";
import { createJsonValueForSchema } from "@/utils/json";
import { invalidateSWRKeys } from "@/service/swr";
import { assert, getErrorMessage, type Optional } from "@/utils/common";
import { getSchemaFromProcessDescriptionInputs } from "@/utils/field";
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
  storage.serviceProviderSelection.delete();
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

////////////////////////////////////////
// Service actions

export async function signIn(
  serviceProviderId: string,
  options: ServiceOptionsInput<ServiceOptions>,
) {
  const provider = getServiceProvider(serviceProviderId);
  storage.serviceProviderSelection.set({
    id: serviceProviderId,
    options,
  });
  try {
    await provider.signIn(options);
    setAppState({ serviceProviderId });
  } catch (e) {
    storage.serviceProviderSelection.delete();
    console.error(e);
    throw e;
  }
  // Note, depending on the provider.signIn() action
  // the app execution ends here (e.g. due to a redirection).
}

export async function signOut() {
  storage.serviceProviderSelection.delete();
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

export function executeActiveProcess() {
  const { service, processId, processRequests } = getAppState();
  if (!service || !processId || !processRequests[processId]) {
    return;
  }
  const processRequest = {
    inputs: processRequests[processId].inputs,
    outputs: processRequests[processId].outputs,
  };
  const processExecution = {
    request: { processId, ...processRequest },
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

// export function showInformationBox(information: InformationData) {
//   setAppState({ information });
// }

export function setActiveProcessInput(inputName: string, inputValue: Input) {
  const state = getAppState();
  const activeProcessId = state.processId;
  if (!activeProcessId) {
    return;
  }
  const processRequest = state.processRequests[activeProcessId];
  const processInputs = processRequest?.inputs;
  assert(
    !!processInputs,
    () => `no inputs found for process ${activeProcessId}`,
  );
  if (processInputs![inputName] === inputValue) {
    return;
  }
  setProcessInputs(activeProcessId, {
    ...processInputs,
    [inputName]: inputValue,
  });
}

export function setProcessInputs(
  processId: string,
  processInputs: ProcessInputs,
) {
  const state = getAppState();
  setAppState({
    processRequests: {
      ...state.processRequests,
      [processId]: {
        ...state.processRequests[processId],
        inputs: processInputs,
      },
    },
  });
}

export function setActiveProcessOutput(
  outputName: string,
  outputValue?: Output,
) {
  const state = getAppState();
  const activeProcessId = state.processId;
  if (!activeProcessId) {
    return;
  }
  const processOutputs = state.processRequests[activeProcessId]?.outputs || {};
  if (outputValue) {
    setProcessOutputs(activeProcessId, {
      ...processOutputs,
      [outputName]: outputValue,
    });
    return;
  }

  const nextProcessOutputs = { ...processOutputs };
  delete nextProcessOutputs[outputName];
  setProcessOutputs(activeProcessId, nextProcessOutputs);
}

export function setProcessOutputs(
  processId: string,
  processOutputs: ProcessOutputs,
) {
  const state = getAppState();
  setAppState({
    processRequests: {
      ...state.processRequests,
      [processId]: {
        ...state.processRequests[processId],
        outputs: processOutputs,
      },
    },
  });
}

export function setInitialProcessInputs(
  processDescription: ProcessDescription,
) {
  const processId = processDescription.id;
  const objectSchema =
    getSchemaFromProcessDescriptionInputs(processDescription);
  const processInputs = createJsonValueForSchema(objectSchema) as ProcessInputs;
  setProcessInputs(processId, processInputs);
}

export function setInitialProcessOutputs(
  processDescription: ProcessDescription,
) {
  const processId = processDescription.id;
  const processOutputs: ProcessOutputs = {};
  Object.keys(processDescription.outputs || {}).forEach((outputName) => {
    processOutputs[outputName] = {
      transmissionMode: processDescription?.outputTransmission?.length
        ? processDescription?.outputTransmission[0]
        : undefined,
    };
  });
  setProcessOutputs(processId, processOutputs);
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

export function closeInformationBox() {
  setAppState({ information: undefined });
}
*/
