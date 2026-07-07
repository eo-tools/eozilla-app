import { describe, expect, it } from "vitest";

import { getFieldFromSchema } from "@/utils/field";
import type { JsonSchema } from "@/utils/json";
import { FieldFactoryRegistry } from "./generator";
import type { FieldFactory } from "./types";

describe("FieldFactoryRegistry", () => {
  it("selects the highest scoring factory", () => {
    const field = getFieldFromSchema("count", {
      type: "integer",
    } as JsonSchema);
    const weakFactory = createFactory(1);
    const strongFactory = createFactory(10);
    const registry = new FieldFactoryRegistry([weakFactory, strongFactory]);

    expect(registry.lookup(field)).toBe(strongFactory);
  });

  it("ignores non-positive factory scores", () => {
    const field = getFieldFromSchema("count", {
      type: "integer",
    } as JsonSchema);
    const registry = new FieldFactoryRegistry([createFactory(0)]);

    expect(registry.lookup(field)).toBeUndefined();
  });
});

function createFactory(score: number): FieldFactory {
  return {
    getScore: () => score,
    render: () => {
      throw new Error("not rendered");
    },
  };
}
