import { isNumber, isObject } from "@/utils/common";
import type { JsonArray, JsonObject, JsonValue } from "./value";
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

export class SchemaValidationError extends Error {
  readonly causes?: SchemaValidationError[];
  constructor(message: string, causes?: SchemaValidationError[]) {
    super(message);
    this.causes = causes;
  }

  toString(): string {
    if (!this.causes) {
      return `${this.message}.`;
    }
    return [
      `${this.message}:`,
      ...this.causes.map((e: SchemaValidationError) => `  - ${e.toString()}`),
    ].join("\n");
  }
}

export function validateJsonValue(
  name: string,
  value: JsonValue,
  schema: JsonSchema,
) {
  if (schema.nullable && value === null) {
    // ok
  } else if (isBooleanSchema(schema) && assertBoolean(name, value)) {
    // ok
  } else if (isNumericSchema(schema) && assertNumeric(name, value)) {
    if (isNumber(schema.minimum)) {
      const eq = !schema.minimumExcluded;
      validateCondition(
        (!eq && value > schema.minimum) || (eq && value >= schema.minimum),
        `${name} must not be less than${eq ? " or equal to" : ""} ${schema.minimum}`,
      );
    }
    if (isNumber(schema.maximum)) {
      const eq = !schema.maximumExcluded;
      validateCondition(
        (!eq && value < schema.maximum) || (eq && value <= schema.maximum),
        `${name} must not be greater than${eq ? " or equal to" : ""} ${schema.maximum}`,
      );
    }
    // ok
  } else if (isStringSchema(schema) && assertString(name, value)) {
    if (isNumber(schema.minLength)) {
      validateCondition(
        value.length >= schema.minLength,
        `${name} must not have less than ${schema.minLength} characters`,
      );
    }
    if (isNumber(schema.maxLength)) {
      validateCondition(
        value.length <= schema.maxLength,
        `${name} must not have more than ${schema.maxLength} characters`,
      );
    }
    // ok
  } else if (isArraySchema(schema) && assertArray(name, value)) {
    if (isNumber(schema.minItems)) {
      validateCondition(
        value.length >= schema.minItems,
        `${name} must not have less than ${schema.minItems} items`,
      );
    }
    if (isNumber(schema.maxItems)) {
      validateCondition(
        value.length <= schema.maxItems,
        `${name} must not have more than ${schema.maxItems} items`,
      );
    }
    if (isObject(schema.items)) {
      const itemsSchema = schema.items as JsonSchema;
      value.forEach((item, index) => {
        validateJsonValue(`${name}.${index.toString()}`, item, itemsSchema);
      });
    }
    // ok
  } else if (isObjectSchema(schema) && assertObject(name, value)) {
    // TODO: use schema.minProperties/.maxProperties
    if (isObject(schema.properties)) {
      const propertySchemas = schema.properties;
      const propertyNames = Object.keys(propertySchemas);
      propertyNames.forEach((propertyName) => {
        const propertySchema = propertySchemas[propertyName];
        if (propertyName in value) {
          validateJsonValue(
            `${name}.${propertyName}`,
            value[propertyName],
            propertySchema,
          );
        } else if ((schema.required || []).includes(propertyName)) {
          throw new SchemaValidationError(
            `${name} is missing required property '${propertyName}'`,
          );
        }
      });

      if (schema.additionalProperties === false) {
        Object.keys(value).forEach((propertyName) => {
          if (!(propertyName in propertySchemas)) {
            throw new SchemaValidationError(
              `${name} must not contain unexpected property '${propertyName}'`,
            );
          }
        });
      }
    }
    // ok
  } else if (isOneOfSchema(schema)) {
    const { count, errors, empty } = applySchemas(name, value, schema.oneOf);
    validateCondition(
      empty || count === 1,
      `${name} matches none or multiple schemas (must match exactly one)`,
      errors,
    );
  } else if (isAnyOfSchema(schema)) {
    const { count, errors, empty } = applySchemas(name, value, schema.anyOf);
    validateCondition(
      empty || count > 0,
      `${name} matches no schema (must match at least one)`,
      errors,
    );
  } else if (isAllOfSchema(schema)) {
    const { count, errors, empty } = applySchemas(name, value, schema.allOf);
    validateCondition(
      empty || count === schema.allOf.length,
      `${name} does not match all schemas`,
      errors,
    );
  }
}

function validateCondition(
  condition: boolean | (() => boolean),
  message: string | (() => string),
  causes?: SchemaValidationError[],
): void {
  if (!(typeof condition === "function" ? condition() : condition)) {
    throw new SchemaValidationError(
      typeof message === "function" ? message() : message,
      causes,
    );
  }
}

function applySchemas(name: string, value: JsonValue, schemas: JsonSchema[]) {
  let count = 0;
  const errors: SchemaValidationError[] = [];
  schemas.forEach((item) => {
    try {
      validateJsonValue(name, value, item);
      count++;
    } catch (e) {
      if (e instanceof SchemaValidationError) {
        errors.push(e);
      } else {
        throw e;
      }
    }
  });
  return { count, errors, empty: schemas.length === 0 };
}

function assertBoolean(name: string, value: JsonValue): value is boolean {
  return assertType(name, value, "boolean");
}

function assertNumeric(name: string, value: JsonValue): value is number {
  return assertType(name, value, "number");
}

function assertString(name: string, value: JsonValue): value is string {
  return assertType(name, value, "string");
}

function assertArray(name: string, value: JsonValue): value is JsonArray {
  if (!Array.isArray(value)) {
    throw createTypeError(name, value, "array");
  }
  return true;
}

function assertObject(name: string, value: JsonValue): value is JsonObject {
  if (!isObject(value)) {
    throw createTypeError(name, value, "object");
  }
  return true;
}

function assertType(name: string, value: JsonValue, type: string) {
  if (typeof value !== type) {
    throw createTypeError(name, value, type);
  }
  return true;
}

function createTypeError(name: string, value: JsonValue, schemaType: string) {
  const valueType = value === null ? "null" : typeof value;
  return new SchemaValidationError(
    `Type of ${name} must be ${schemaType}, but was ${valueType}`,
  );
}
