import { describe, expect, it } from "vitest";
import { SchemaValidationError, validateJsonValue } from "./validateJsonValue";
import type { JsonSchema } from "./schema";

describe("SchemaValidationError", () => {
  it("formats nested causes", () => {
    const error = new SchemaValidationError("root", [
      new SchemaValidationError("child"),
    ]);

    expect(error.toString()).toBe("root:\n  - child.");
  });
});

describe("validateJsonValue", () => {
  it("accepts primitive values that match the schema", () => {
    expect(() =>
      validateJsonValue("flag", true, { type: "boolean" } as JsonSchema),
    ).not.toThrow();
    expect(() =>
      validateJsonValue("count", 2, { type: "integer" } as JsonSchema),
    ).not.toThrow();
    expect(() =>
      validateJsonValue("name", "Ada", { type: "string" } as JsonSchema),
    ).not.toThrow();
  });

  it("enforces numeric and string bounds", () => {
    expect(() =>
      validateJsonValue("count", 1, {
        type: "number",
        minimum: 2,
        minimumExcluded: true,
      } as JsonSchema),
    ).toThrowError("count must not be less than 2");

    expect(() =>
      validateJsonValue("count", 4, {
        type: "number",
        maximum: 3,
        maximumExcluded: true,
      } as JsonSchema),
    ).toThrowError("count must not be greater than 3");

    expect(() =>
      validateJsonValue("name", "abc", {
        type: "string",
        minLength: 4,
      } as JsonSchema),
    ).toThrowError("name must not have less than 4 characters");
  });

  it("validates arrays and nested items", () => {
    expect(() =>
      validateJsonValue("tags", ["a", "b"], {
        type: "array",
        minItems: 2,
        items: { type: "string" },
      } as JsonSchema),
    ).not.toThrow();

    expect(() =>
      validateJsonValue("tags", ["a"], {
        type: "array",
        minItems: 2,
      } as JsonSchema),
    ).toThrowError("tags must not have less than 2 items");

    expect(() =>
      validateJsonValue("tags", ["a", 1], {
        type: "array",
        items: { type: "string" },
      } as JsonSchema),
    ).toThrowError("Type of tags.1 must be string, but was number");
  });

  it("requires declared object properties", () => {
    expect(() =>
      validateJsonValue("payload", { name: "Ada" }, {
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
        required: ["name", "age"],
      } as JsonSchema),
    ).toThrowError("payload is missing required property 'age'");
  });

  it("rejects unexpected object properties when additionalProperties is false", () => {
    expect(() =>
      validateJsonValue("payload", { text: "manual input" }, {
        type: "object",
        additionalProperties: false,
        properties: {
          bucket: { type: "string" },
          object: { type: "string" },
        },
      } as JsonSchema),
    ).toThrowError("payload must not contain unexpected property 'text'");
  });

  it("supports oneOf, anyOf, and allOf", () => {
    expect(() =>
      validateJsonValue("value", "ok", {
        oneOf: [{ type: "string" }, { type: "number" }],
      } as JsonSchema),
    ).not.toThrow();

    expect(() =>
      validateJsonValue("value", 1, {
        anyOf: [{ type: "string" }, { type: "number" }],
      } as JsonSchema),
    ).not.toThrow();

    expect(() =>
      validateJsonValue("value", "abc", {
        allOf: [
          { type: "string", minLength: 2 },
          { type: "string", maxLength: 3 },
        ],
      } as JsonSchema),
    ).not.toThrow();
  });

  it("reports schema mismatches for union types", () => {
    expect(() =>
      validateJsonValue("value", true, {
        oneOf: [{ type: "string" }, { type: "number" }],
      } as JsonSchema),
    ).toThrowError("value matches none or multiple schemas");

    expect(() =>
      validateJsonValue("value", true, {
        anyOf: [{ type: "string" }, { type: "number" }],
      } as JsonSchema),
    ).toThrowError("value matches no schema");

    expect(() =>
      validateJsonValue("value", "abc", {
        allOf: [{ type: "string", minLength: 4 }, { type: "string" }],
      } as JsonSchema),
    ).toThrowError("value does not match all schemas");
  });
});
