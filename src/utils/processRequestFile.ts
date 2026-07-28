import type { ProcessDescription, ProcessRequest } from "@/service";
import { getSchemaFromProcessDescriptionInputs } from "@/utils/field";
import { isJsonObject, validateJsonValue, type JsonObject } from "@/utils/json";

export function stringifyProcessRequestJson(
  processRequest: ProcessRequest,
): string {
  return JSON.stringify(processRequest, null, 2);
}

export function parseProcessRequestJson(
  text: string,
  processDescription: ProcessDescription,
): ProcessRequest {
  const value: unknown = JSON.parse(text);
  if (!isJsonObject(value)) {
    throw new Error("Process request import must be a JSON object.");
  }
  validateProcessRequest(value, processDescription);
  return value as ProcessRequest;
}

function validateProcessRequest(
  value: JsonObject,
  processDescription: ProcessDescription,
) {
  const allowedTopLevelKeys = new Set([
    "inputs",
    "outputs",
    "subscriber",
    "response",
  ]);
  for (const key of Object.keys(value)) {
    if (!allowedTopLevelKeys.has(key)) {
      throw new Error(
        `Process request contains unsupported property '${key}'.`,
      );
    }
  }

  if ("inputs" in value) {
    validateProcessRequestInputs(value.inputs, processDescription);
  }
  if ("outputs" in value) {
    validateProcessRequestOutputs(value.outputs, processDescription);
  }
  if ("subscriber" in value) {
    validateProcessRequestSubscriber(value.subscriber);
  }
  if ("response" in value) {
    validateProcessRequestResponse(value.response);
  }
}

function validateProcessRequestInputs(
  value: unknown,
  processDescription: ProcessDescription,
) {
  if (!isJsonObject(value)) {
    throw new Error("Process request inputs must be a JSON object.");
  }

  const allowedInputNames = new Set(
    Object.keys(processDescription.inputs ?? {}),
  );
  for (const key of Object.keys(value)) {
    if (!allowedInputNames.has(key)) {
      throw new Error(`Process request contains unsupported input '${key}'.`);
    }
  }

  validateJsonValue(
    "inputs",
    value,
    getSchemaFromProcessDescriptionInputs(processDescription),
  );
}

function validateProcessRequestOutputs(
  value: unknown,
  processDescription: ProcessDescription,
) {
  if (!isJsonObject(value)) {
    throw new Error("Process request outputs must be a JSON object.");
  }

  const allowedOutputNames = new Set(
    Object.keys(processDescription.outputs ?? {}),
  );
  for (const key of Object.keys(value)) {
    if (!allowedOutputNames.has(key)) {
      throw new Error(`Process request contains unsupported output '${key}'.`);
    }

    const outputValue = value[key];
    if (!isJsonObject(outputValue)) {
      throw new Error(`Process request outputs.${key} must be a JSON object.`);
    }
    if (
      "transmissionMode" in outputValue &&
      outputValue.transmissionMode !== "value" &&
      outputValue.transmissionMode !== "reference"
    ) {
      throw new Error(
        `Process request outputs.${key}.transmissionMode must be "value" or "reference".`,
      );
    }
    if ("format" in outputValue && !isJsonObject(outputValue.format)) {
      throw new Error(
        `Process request outputs.${key}.format must be an object.`,
      );
    }
  }
}

function validateProcessRequestSubscriber(value: unknown) {
  if (!isJsonObject(value)) {
    throw new Error("Process request subscriber must be a JSON object.");
  }

  for (const key of ["successUri", "inProgressUri", "failedUri"] as const) {
    if (key in value && typeof value[key] !== "string") {
      throw new Error(`Process request subscriber.${key} must be a string.`);
    }
  }
}

function validateProcessRequestResponse(value: unknown) {
  if (value !== "raw" && value !== "document") {
    throw new Error('Process request response must be "raw" or "document".');
  }
}
