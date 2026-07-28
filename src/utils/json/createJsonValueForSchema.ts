import {
  isAllOfSchema,
  isAnyOfSchema,
  isArraySchema,
  isBooleanSchema,
  isNumericSchema,
  isObjectSchema,
  isOneOfSchema,
  isStringSchema,
  type JsonSchema,
} from "./schema";
import {
  mergeAllOfSchemas,
  withCompositionDiscriminatorValue,
} from "./composition";
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
    return createArrayValueForSchema(schema);
  } else if (isObjectSchema(schema)) {
    const properties = schema.properties || {};
    const value: Record<string, JsonValue> = {};
    Object.keys(properties).forEach((key) => {
      value[key] = createJsonValueForSchema(properties[key]!);
    });
    return value as JsonValue;
  } else if (isOneOfSchema(schema)) {
    return createSelectiveValue(schema.oneOf[0], schema.discriminator, 0);
  } else if (isAnyOfSchema(schema)) {
    return createSelectiveValue(schema.anyOf[0], schema.discriminator, 0);
  } else if (isAllOfSchema(schema)) {
    return createJsonValueForSchema(mergeAllOfSchemas(schema.allOf));
  } else if (schema.nullable) {
    return null;
  }
  return 0;
}

function createArrayValueForSchema(
  schema: Extract<JsonSchema, { type: "array" }>,
) {
  const items = schema.items || {};
  const itemDefault =
    typeof items.default !== "undefined"
      ? createJsonValueForSchema(items)
      : undefined;
  const n = schema.minItems || 0;

  if (n === 0) {
    return itemDefault !== undefined ? [itemDefault] : [];
  }

  return Array.from({ length: n }, () => createJsonValueForSchema(items));
}

function createSelectiveValue(
  option: JsonSchema | undefined,
  discriminator: JsonSchema["discriminator"] | undefined,
  optionIndex: number,
): JsonValue {
  if (!option) {
    return 0;
  }

  return withCompositionDiscriminatorValue(
    createJsonValueForSchema(option),
    option,
    discriminator,
    optionIndex,
  );
}
