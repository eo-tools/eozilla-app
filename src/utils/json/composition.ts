import type { Discriminator, JsonSchema } from "./schema";
import type { JsonValue } from "./value";

export function isJsonObjectValue(
  value: JsonValue,
): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getCompositionOptionDiscriminatorValue(
  option: Pick<JsonSchema, "ref">,
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

export function withCompositionDiscriminatorValue(
  value: JsonValue,
  option: Pick<JsonSchema, "ref">,
  discriminator: Discriminator | undefined,
  optionIndex: number,
): JsonValue {
  if (!discriminator || !isJsonObjectValue(value)) {
    return value;
  }

  return {
    ...value,
    [discriminator.propertyName]: getCompositionOptionDiscriminatorValue(
      option,
      discriminator,
      optionIndex,
    ),
  };
}

export function mergeAllOfSchemas(schemas: JsonSchema[]): JsonSchema {
  const merged: Record<string, unknown> = {};
  const properties: Record<string, JsonSchema> = {};

  for (const schema of schemas) {
    const schemaObject = schema as Record<string, unknown>;
    if (schemaObject.type !== undefined && merged.type === undefined) {
      merged.type = schemaObject.type;
    }
    if (
      schemaObject.properties &&
      typeof schemaObject.properties === "object"
    ) {
      Object.assign(properties, schemaObject.properties);
    }
  }

  if (Object.keys(properties).length > 0) {
    merged.properties = properties;
  }

  return merged as JsonSchema;
}
