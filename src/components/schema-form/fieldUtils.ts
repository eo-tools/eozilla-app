import type {
  ArrayField,
  Field,
  ObjectField,
  PrimitiveField,
} from "@/utils/field";
import {
  createJsonValueForSchema,
  isArraySchema,
  isBooleanSchema,
  isNumericSchema,
  isObjectSchema,
  isStringSchema,
  type JsonObject,
  type JsonValue,
} from "@/utils/json";
import { isObject } from "@/utils/common";

import type { FieldValue } from "./types";

export function isPrimitiveField(field: Field): field is PrimitiveField {
  return (
    isBooleanSchema(field.schema) ||
    isNumericSchema(field.schema) ||
    isStringSchema(field.schema)
  );
}

export function isArrayField(field: Field): field is ArrayField {
  return isArraySchema(field.schema) && "items" in field;
}

export function isObjectField(field: Field): field is ObjectField {
  return isObjectSchema(field.schema) && "properties" in field;
}

export function getFieldLabel(field: Field): string {
  return field.schema.title ?? makeLabel(field.name);
}

export function getFieldDescription(field: Field): string | undefined {
  return field.schema.description;
}

export function getFieldValue(field: Field, value: FieldValue): JsonValue {
  if (value !== undefined) {
    return value;
  }
  return createJsonValueForSchema(field.schema);
}

export function asObjectValue(field: Field, value: FieldValue): JsonObject {
  const initialValue = getFieldValue(field, value);
  return isObject(initialValue) ? initialValue : {};
}

export function replaceObjectProperty(
  value: JsonObject,
  propertyName: string,
  propertyValue: JsonValue,
): JsonObject {
  return {
    ...value,
    [propertyName]: propertyValue,
  };
}

export function getNonNullableField(field: Field): Field {
  return {
    ...field,
    schema: {
      ...field.schema,
      nullable: false,
    },
  } as Field;
}

function makeLabel(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
