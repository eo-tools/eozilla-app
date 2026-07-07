import { MapField } from "../MapField";
import { ArrayField, type ArrayFieldMode } from "../ArrayField";
import { isArrayField, isPrimitiveField } from "../fieldUtils";
import type { JsonValue } from "@/utils/json";
import type { FieldFactory } from "../types";

const defaultSeparator = ", ";

export const arrayFieldFactory: FieldFactory = {
  getScore(field) {
    if (isMapArrayField(field)) {
      return 20;
    }
    return isSupportedArrayField(field) ? 10 : 0;
  },
  render(ctx) {
    const arrayField = ctx.field;
    if (!isArrayField(arrayField)) {
      throw new Error(`Unsupported array field '${ctx.field.name}'.`);
    }

    if (isMapArrayField(arrayField)) {
      return (
        <MapField
          field={arrayField}
          valueType="bbox"
          value={getBBoxValue(ctx.value)}
          onChange={(nextValue) => ctx.onChange(nextValue)}
          hideLabel={ctx.hideLabel}
        />
      );
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
    (field.widget === "editor" || shouldRenderArrayInput(field))
  );
}

function isMapArrayField(field: Parameters<FieldFactory["getScore"]>[0]) {
  return (
    isArrayField(field) &&
    field.widget === "map" &&
    isPrimitiveField(field.items) &&
    field.items.schema.type === "number" &&
    field.schema.minItems === 4 &&
    field.schema.maxItems === 4
  );
}

function getArrayFieldMode(
  field: Parameters<FieldFactory["getScore"]>[0],
): ArrayFieldMode {
  if (shouldRenderArrayInput(field)) {
    return "input";
  }

  throw new Error(`Unsupported array field '${field.name}'.`);
}

function shouldRenderArrayInput(
  field: Parameters<FieldFactory["getScore"]>[0],
) {
  return (
    isArrayField(field) &&
    field.widget !== "editor" &&
    isPrimitiveField(field.items) &&
    !field.items.schema.enum
  );
}

function getArraySeparator(field: Parameters<FieldFactory["getScore"]>[0]) {
  return field.separator ?? defaultSeparator;
}

function getBBoxValue(value: JsonValue | undefined): number[] {
  return Array.isArray(value) ? (value as number[]) : [0, 0, 0, 0];
}
