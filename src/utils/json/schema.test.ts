import { describe, expect, it } from "vitest";
import {
  isAllOfSchema,
  isAnyOfSchema,
  isArraySchema,
  isBooleanSchema,
  isIntegerSchema,
  isNumericSchema,
  isObjectSchema,
  isOneOfSchema,
  isNumberSchema,
  isStringSchema,
} from "./schema";

describe("json schema guards", () => {
  it("identifies primitive schema variants", () => {
    expect(isBooleanSchema({ type: "boolean" })).toBe(true);
    expect(isNumericSchema({ type: "number" })).toBe(true);
    expect(isIntegerSchema({ type: "integer" })).toBe(true);
    expect(isNumberSchema({ type: "number" })).toBe(true);
    expect(isStringSchema({ type: "string" })).toBe(true);
    expect(isArraySchema({ type: "array" })).toBe(true);
    expect(isObjectSchema({ type: "object" })).toBe(true);
  });

  it("identifies composite schema variants", () => {
    expect(isOneOfSchema({ oneOf: [] })).toBe(true);
    expect(isAnyOfSchema({ anyOf: [] })).toBe(true);
    expect(isAllOfSchema({ allOf: [] })).toBe(true);
  });
});
