import {
  compileExpression,
  evaluateConditionExpression,
} from "@/components/dynamic-expressions";
import type {
  ServiceOptionSchema,
  ServiceOptions,
  ServiceOptionsInput,
  ServiceProvider,
} from "@/service";
import type { JsonValue } from "@/utils/json";

export type ServiceOptionDraftValue =
  | string
  | number
  | boolean
  | null
  | undefined;
export type ServiceOptionDraft = Record<string, ServiceOptionDraftValue>;

export function normalizeServiceProviderOptions(
  provider: ServiceProvider<ServiceOptions>,
  draft: ServiceOptionDraft,
): ServiceOptionsInput<ServiceOptions> {
  const options: Record<string, string | number | boolean> = {};

  Object.entries(provider.optionsSchema ?? {}).forEach(([key, schema]) => {
    if (!isVisible(schema, draft, key)) {
      return;
    }
    const value = draft[key];
    if (value === null || value === undefined) {
      if (schema.default !== undefined) {
        options[key] = schema.default;
        return;
      }
      if (schema.nullable) {
        return;
      }
    }

    if (schema.type === "boolean") {
      options[key] = Boolean(value);
      return;
    }

    if (schema.type === "string") {
      const stringValue = isEmptyDraftValue(value) ? "" : String(value);
      if (!stringValue) {
        if (schema.default !== undefined) {
          options[key] = schema.default;
          return;
        }
        if (schema.nullable) {
          return;
        }
        throw new Error(`Please provide a value for ${schema.title}.`);
      }
      options[key] = stringValue;
      return;
    }

    const rawValue = isEmptyDraftValue(value) ? undefined : value;
    if (rawValue === undefined) {
      if (schema.default !== undefined) {
        options[key] = schema.default;
        return;
      }
      if (schema.nullable) {
        return;
      }
      throw new Error(`Please provide a value for ${schema.title}.`);
    }

    const numberValue =
      typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(numberValue)) {
      throw new Error(`Please provide a valid value for ${schema.title}.`);
    }
    options[key] =
      schema.type === "integer" ? Math.trunc(numberValue) : numberValue;
  });

  return options;
}

function isVisible(
  schema: ServiceOptionSchema,
  draft: ServiceOptionDraft,
  key: string,
): boolean {
  return (
    evaluateCondition(schema["x-ui-visible"], true, draft, key) &&
    !evaluateCondition(schema["x-ui-hidden"], false, draft, key)
  );
}

function evaluateCondition(
  condition: boolean | string | undefined,
  fallback: boolean,
  draft: ServiceOptionDraft,
  key: string,
): boolean {
  if (typeof condition === "boolean") {
    return condition;
  }
  if (typeof condition !== "string") {
    return fallback;
  }
  return evaluateConditionExpression(compileExpression(condition), {
    root: draft as unknown as JsonValue,
    valuePath: [key],
  });
}

function isEmptyDraftValue(value: ServiceOptionDraftValue): boolean {
  return value === null || value === undefined || value === "";
}
