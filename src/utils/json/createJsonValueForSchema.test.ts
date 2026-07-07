import { describe, expect, it } from "vitest";
import { createJsonValueForSchema } from "./createJsonValueForSchema";
import type { JsonSchema } from "./schema";

describe("createJsonValueForSchema", () => {
  it("prefers explicit defaults and enum values", () => {
    expect(
      createJsonValueForSchema({
        type: "string",
        default: "hello",
      } as JsonSchema),
    ).toBe("hello");
    expect(
      createJsonValueForSchema({
        type: "string",
        enum: ["first", "second"],
      } as JsonSchema),
    ).toBe("first");
  });

  it("creates sensible primitive and nested values", () => {
    expect(createJsonValueForSchema({ type: "boolean" } as JsonSchema)).toBe(
      false,
    );
    expect(createJsonValueForSchema({ type: "number" } as JsonSchema)).toBe(0);
    expect(createJsonValueForSchema({ type: "string" } as JsonSchema)).toBe("");
    expect(
      createJsonValueForSchema({ nullable: true } as JsonSchema),
    ).toBeNull();
  });

  it("creates nested array and object values", () => {
    expect(
      createJsonValueForSchema({
        type: "array",
        items: { type: "string", default: "ABC" },
      } as JsonSchema),
    ).toEqual(["ABC"]);

    expect(
      createJsonValueForSchema({
        type: "array",
        minItems: 2,
        items: { type: "string", default: "item" },
      } as JsonSchema),
    ).toEqual(["item", "item"]);

    expect(
      createJsonValueForSchema({
        type: "object",
        properties: {
          name: { type: "string", default: "Alice" },
          count: { type: "integer" },
        },
      } as JsonSchema),
    ).toEqual({ name: "Alice", count: 0 });
  });

  it("creates values for composed schemas", () => {
    expect(
      createJsonValueForSchema({
        oneOf: [
          { type: "string", default: "s3://data" },
          { type: "number", default: 3 },
        ],
      } as JsonSchema),
    ).toBe("s3://data");

    expect(
      createJsonValueForSchema({
        anyOf: [
          { type: "boolean", default: true },
          { type: "integer", default: 5 },
        ],
      } as JsonSchema),
    ).toBe(true);

    expect(
      createJsonValueForSchema({
        allOf: [
          {
            type: "object",
            properties: { bucket: { type: "string", default: "data" } },
          },
          {
            type: "object",
            properties: { object: { type: "string", default: "file.tif" } },
          },
        ],
      } as JsonSchema),
    ).toEqual({ bucket: "data", object: "file.tif" });
  });

  it("adds discriminator values for the active option", () => {
    expect(
      createJsonValueForSchema({
        oneOf: [
          {
            ref: "#/components/schemas/Point",
            type: "object",
            properties: {
              type: { type: "string" },
              coordinates: {
                type: "array",
                minItems: 2,
                items: { type: "number" },
              },
            },
          },
        ],
        discriminator: {
          propertyName: "type",
          mapping: {
            pt: "#/components/schemas/Point",
          },
        },
      } as JsonSchema),
    ).toEqual({ type: "pt", coordinates: [0, 0] });
  });

  it("falls back to zero for untyped schemas", () => {
    expect(createJsonValueForSchema({} as JsonSchema)).toBe(0);
  });
});
