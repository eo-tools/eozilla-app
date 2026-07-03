import {
  isAllOfSchema,
  isAnyOfSchema,
  isArraySchema,
  isBooleanSchema,
  isNumericSchema,
  isObjectSchema,
  isOneOfSchema,
  isStringSchema,
  type Discriminator,
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
    return createAllOfValue(schema.allOf);
  } else if (schema.nullable) {
    return null;
  }
  return 0;
}

function createArrayValueForSchema(schema: Extract<JsonSchema, { type: "array" }>) {
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
  discriminator: Discriminator | undefined,
  optionIndex: number,
): JsonValue {
  if (!option) {
    return 0;
  }

  return withDiscriminatorValue(
    createJsonValueForSchema(option),
    option,
    discriminator,
    optionIndex,
  );
}

function createAllOfValue(schemas: JsonSchema[]): JsonValue {
  if (schemas.length === 0) {
    return 0;
  }

  const values = schemas.map((schema) => createJsonValueForSchema(schema));
  if (values.every(isJsonObjectValue)) {
    return values.reduce<Record<string, JsonValue>>(
      (acc, value) => ({ ...acc, ...value }),
      {},
    ) as JsonValue;
  }

  return values[0] ?? 0;
}

function withDiscriminatorValue(
  value: JsonValue,
  option: JsonSchema,
  discriminator: Discriminator | undefined,
  optionIndex: number,
): JsonValue {
  if (!discriminator || !isJsonObjectValue(value)) {
    return value;
  }

  return {
    ...value,
    [discriminator.propertyName]: getOptionDiscriminatorValue(
      option,
      discriminator,
      optionIndex,
    ),
  };
}

function getOptionDiscriminatorValue(
  option: JsonSchema,
  discriminator: Discriminator,
  optionIndex: number,
): string {
  const optionRef = option.ref;
  if (optionRef && discriminator.mapping) {
    const mapped = Object.entries(discriminator.mapping).find(
      ([, ref]) => ref === optionRef,
    );
    if (mapped) {
      return mapped[0];
    }
  }

  return optionRef?.split("/").pop() ?? String(optionIndex);
}

function isJsonObjectValue(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
