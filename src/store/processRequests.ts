import type {
  ProcessDescription,
  ProcessInputs,
  ProcessOutputs,
  ProcessRequest,
} from "@/service";
import { getSchemaFromProcessDescriptionInputs } from "@/utils/field";
import { createJsonValueForSchema } from "@/utils/json";

export function ensureInitialProcessRequest(
  processRequests: Record<string, ProcessRequest>,
  processDescription: ProcessDescription,
): ProcessRequest {
  const processId = processDescription.id;
  return (
    processRequests[processId] ?? createInitialProcessRequest(processDescription)
  );
}

function createInitialProcessRequest(
  processDescription: ProcessDescription,
): ProcessRequest {
  return {
    inputs: createInitialProcessInputs(processDescription),
    outputs: createInitialProcessOutputs(processDescription),
  };
}

export function createInitialProcessInputs(
  processDescription: ProcessDescription,
) {
  const objectSchema =
    getSchemaFromProcessDescriptionInputs(processDescription);
  return createJsonValueForSchema(objectSchema) as ProcessInputs;
}

export function createInitialProcessOutputs(
  processDescription: ProcessDescription,
): ProcessOutputs {
  const processOutputs: ProcessOutputs = {};
  for (const outputName of Object.keys(processDescription.outputs ?? {})) {
    processOutputs[outputName] = {};
  }
  return processOutputs;
}
