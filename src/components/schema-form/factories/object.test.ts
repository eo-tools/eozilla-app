import { describe, expect, it } from "vitest";

import { getFieldFromSchema } from "@/utils/field";
import type { JsonSchema } from "@/utils/json";
import { objectFieldFactory } from "./object";

describe("objectFieldFactory", () => {
  it("lets JSON fallback handle unstructured object editors", () => {
    const field = getFieldFromSchema("metadata", {
      type: "object",
      additionalProperties: true,
    } as JsonSchema);

    expect(objectFieldFactory.getScore(field)).toBe(0);
  });
});
