import { isBoolean, isNumber, isObject, isString } from "@/utils/common";

export type JsonPrimitive = null | boolean | number | string;
export type JsonObject = { [Key in string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export function isJsonValue(value: unknown): value is JsonValue {
  return isJsonPrimitive(value) || isJsonArray(value) || isJsonObject(value);
}

export function isJsonPrimitive(value: unknown): value is JsonPrimitive {
  return (
    value === null || isBoolean(value) || isNumber(value) || isString(value)
  );
}

export function isJsonArray(value: unknown): value is JsonArray {
  if (!Array.isArray(value)) {
    return false;
  }
  for (const item of value) {
    if (!isJsonValue(item)) {
      return false;
    }
  }
  return true;
}

export function isJsonObject(value: unknown): value is JsonObject {
  if (!isObject(value)) {
    return false;
  }
  if (Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return false;
  }
  for (const key of Object.keys(value)) {
    if (!isJsonValue(value[key])) {
      return false;
    }
  }
  return true;
}
