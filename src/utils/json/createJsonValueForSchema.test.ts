import { describe, expect, it } from "vitest";
import { createJsonValueForSchema } from "./createJsonValueForSchema";
import type { JsonSchema } from "./schema";

describe("createJsonValueForSchema", () => {
  it("prefers explicit defaults and enum values", () => {
    expect(
      createJsonValueForSchema({ type: "string", default: "hello" } as JsonSchema),
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
    expect(createJsonValueForSchema({ nullable: true } as JsonSchema)).toBeNull();
  });

  it("creates nested array and object values", () => {
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

  it("falls back to zero for untyped schemas", () => {
    expect(createJsonValueForSchema({} as JsonSchema)).toBe(0);
  });
});
