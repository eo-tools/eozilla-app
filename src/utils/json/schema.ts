import type { JsonValue } from "./value";

export interface SchemaBase<T extends JsonValue = JsonValue> {
  type?: "boolean" | "integer" | "number" | "string" | "array" | "object";
  nullable?: boolean;
  default?: T;
  enum?: T[];
  title?: string;
  description?: string;
}

export type UntypedSchema = SchemaBase;

export interface BooleanSchema extends SchemaBase<boolean> {
  type: "boolean";
}

export interface NumericSchema extends SchemaBase<number> {
  type: "integer" | "number";
  minimum?: number;
  maximum?: number;
  multipleOf?: number;
  minimumExcluded?: boolean;
  maximumExcluded?: boolean;
}

export interface IntegerSchema extends NumericSchema {
  type: "integer";
}

export interface NumberSchema extends NumericSchema {
  type: "number";
}

export interface StringSchema extends SchemaBase<number> {
  type: "string";
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface ArraySchema extends SchemaBase<number> {
  type: "array";
  items?: JsonSchema;
  minItems?: number;
  maxItems?: number;
}

export interface ObjectSchema extends SchemaBase<number> {
  type: "object";
  properties?: Record<string, JsonSchema>;
  additionalProperties?: JsonSchema | boolean;
  required?: string[];
}

export interface OneOfSchema extends UntypedSchema {
  oneOf: JsonSchema[];
}

export interface AnyOfSchema extends UntypedSchema {
  anyOf: JsonSchema[];
}

export interface AllOfSchema extends UntypedSchema {
  allOf: JsonSchema[];
}

export type JsonSchema =
  | UntypedSchema
  | BooleanSchema
  | IntegerSchema
  | NumberSchema
  | StringSchema
  | ArraySchema
  | ObjectSchema
  | OneOfSchema
  | AnyOfSchema
  | AllOfSchema;

export function isBooleanSchema(s: JsonSchema): s is BooleanSchema {
  return s.type === "boolean";
}
export function isNumericSchema(s: JsonSchema): s is NumericSchema {
  return s.type === "integer" || s.type === "number";
}
export function isIntegerSchema(s: JsonSchema): s is IntegerSchema {
  return s.type === "integer";
}
export function isNumberSchema(s: JsonSchema): s is NumberSchema {
  return s.type === "number";
}
export function isStringSchema(s: JsonSchema): s is StringSchema {
  return s.type === "string";
}
export function isArraySchema(s: JsonSchema): s is ArraySchema {
  return s.type === "array";
}
export function isObjectSchema(s: JsonSchema): s is ObjectSchema {
  return s.type === "object";
}
export function isOneOfSchema(s: JsonSchema): s is OneOfSchema {
  return "oneOf" in s && Array.isArray(s.oneOf);
}
export function isAnyOfSchema(s: JsonSchema): s is AnyOfSchema {
  return "anyOf" in s && Array.isArray(s.anyOf);
}
export function isAllOfSchema(s: JsonSchema): s is AllOfSchema {
  return "allOf" in s && Array.isArray(s.allOf);
}
