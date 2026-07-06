import { describe, expect, it } from "vitest";

import type { JsonSchema } from "./schema";
import {
  getCompositionOptionDiscriminatorValue,
  mergeAllOfSchemas,
  withCompositionDiscriminatorValue,
} from "./composition";

describe("json composition helpers", () => {
  it("uses discriminator mapping before schema-name fallback", () => {
    expect(
      getCompositionOptionDiscriminatorValue(
        { ref: "#/components/schemas/Point" } as JsonSchema,
        { propertyName: "type", mapping: { pt: "#/components/schemas/Point" } },
        0,
      ),
    ).toBe("pt");

    expect(
      getCompositionOptionDiscriminatorValue(
        { ref: "#/components/schemas/LineString" } as JsonSchema,
        { propertyName: "type" },
        1,
      ),
    ).toBe("LineString");
  });

  it("writes discriminator values only into object values", () => {
    expect(
      withCompositionDiscriminatorValue(
        { coordinates: [0, 0] },
        { ref: "#/components/schemas/Point" } as JsonSchema,
        { propertyName: "type", mapping: { pt: "#/components/schemas/Point" } },
        0,
      ),
    ).toEqual({ coordinates: [0, 0], type: "pt" });

    expect(
      withCompositionDiscriminatorValue(
        "value",
        { ref: "#/components/schemas/Point" } as JsonSchema,
        { propertyName: "type" },
        0,
      ),
    ).toBe("value");
  });

  it("merges the current simple allOf object fragments", () => {
    expect(
      mergeAllOfSchemas([
        {
          type: "object",
          title: "A",
          description: "First part",
          additionalProperties: false,
          required: ["bucket"],
          properties: { bucket: { type: "string" } },
        },
        {
          type: "object",
          title: "B",
          description: "Second part",
          additionalProperties: false,
          required: ["object"],
          properties: { object: { type: "string" } },
        },
      ] as JsonSchema[]),
    ).toMatchObject({
      type: "object",
      properties: {
        bucket: { type: "string" },
        object: { type: "string" },
      },
    });
  });
});
