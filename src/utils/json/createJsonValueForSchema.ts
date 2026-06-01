import {
  isArraySchema,
  isBooleanSchema,
  isNumericSchema,
  isObjectSchema,
  isStringSchema,
  type JsonSchema,
} from "./schema";
import type { JsonValue } from "./value";

export function createJsonValueForSchema(schema: JsonSchema): JsonValue {
  if (typeof schema.default !== "undefined") {
    return schema.default;
  } else if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0];
  } else if (isBooleanSchema(schema)) {
    return false;
  } else if (isNumericSchema(schema)) {
    return 0;
  } else if (isStringSchema(schema)) {
    return "";
  } else if (isArraySchema(schema)) {
    const items = schema.items || {};
    const n = schema.minItems || 0;
    const value: JsonValue[] = Array.from({ length: n });
    return value.map(() => createJsonValueForSchema(items)) as JsonValue;
  } else if (isObjectSchema(schema)) {
    const properties = schema.properties || {};
    const value: Record<string, JsonValue> = {};
    Object.keys(properties).forEach((key) => {
      value[key] = createJsonValueForSchema(properties[key]!);
    });
    return value as JsonValue;
  } else if (schema.nullable) {
    // TODO: consider oneOf, anyOf, allOf
    return null;
  }
  return 0;
}
