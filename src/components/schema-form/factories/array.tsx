import { isStringSchema } from "@/utils/json";
import { ArrayField, type ArrayFieldMode } from "../ArrayField";
import { isArrayField, isPrimitiveField } from "../fieldUtils";
import type { FieldFactory } from "../types";

const defaultSeparator = ", ";

export const arrayFieldFactory: FieldFactory = {
  getScore(field) {
    return isSupportedArrayField(field) ? 12 : 0;
  },
  render(ctx) {
    const arrayField = ctx.field;
    if (!isArrayField(arrayField)) {
      throw new Error(`Unsupported array field '${ctx.field.name}'.`);
    }

    if (arrayField.widget === "editor") {
      return (
        <ArrayField
          ctx={ctx}
          mode="editor"
          separator={getArraySeparator(arrayField)}
        />
      );
    }

    return (
      <ArrayField
        ctx={ctx}
        mode={getArrayFieldMode(arrayField)}
        separator={getArraySeparator(arrayField)}
      />
    );
  },
};

function isSupportedArrayField(field: Parameters<FieldFactory["getScore"]>[0]) {
  return (
    isArrayField(field) &&
    field.widget !== "map" &&
    !field.schema.nullable &&
    (field.widget === "editor" ||
      shouldRenderArrayInput(field) ||
      isDateRangeArray(field) ||
      isDateTimeRangeArray(field))
  );
}

function getArrayFieldMode(field: Parameters<FieldFactory["getScore"]>[0]): ArrayFieldMode {
  if (isDateRangeArray(field)) {
    return "date-range";
  }

  if (isDateTimeRangeArray(field)) {
    return "date-time-range";
  }

  if (shouldRenderArrayInput(field)) {
    return "input";
  }

  throw new Error(`Unsupported array field '${field.name}'.`);
}

function shouldRenderArrayInput(field: Parameters<FieldFactory["getScore"]>[0]) {
  if (!isArrayField(field)) {
    return false;
  }

  if (field.widget === "editor") {
    return false;
  }

  if (!isPrimitiveField(field.items)) {
    return false;
  }

  if (
    isStringSchema(field.items.schema) &&
    (field.items.schema.format === "date" ||
      field.items.schema.format === "date-time")
  ) {
    return false;
  }

  if (field.items.schema.enum) {
    return false;
  }

  return true;
}

function isDateRangeArray(field: Parameters<FieldFactory["getScore"]>[0]) {
  return isRangeArray(field, "date");
}

function isDateTimeRangeArray(field: Parameters<FieldFactory["getScore"]>[0]) {
  return isRangeArray(field, "date-time");
}

function isRangeArray(
  field: Parameters<FieldFactory["getScore"]>[0],
  format: string,
) {
  return isArrayField(field) &&
    isPrimitiveField(field.items) &&
    isStringSchema(field.items.schema) &&
    field.items.schema.format === format &&
    field.schema.minItems === 2 &&
    field.schema.maxItems === 2;
}

function getArraySeparator(
  field: Parameters<FieldFactory["getScore"]>[0],
) {
  return field.separator ?? defaultSeparator;
}
