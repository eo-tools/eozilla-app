import { describe, expect, it } from "vitest";

import { schemaFixtures } from "./schemaFixtures";

describe("schemaFixtures", () => {
  it("resolves local schema references while keeping the original ref", () => {
    const fixture = schemaFixtures.find(({ id }) => id === "discriminator");
    const schema = fixture?.schema as {
      properties?: {
        discriminator_with_mapping?: {
          oneOf?: { ref?: string; type?: string }[];
        };
      };
    };

    const options = schema.properties?.discriminator_with_mapping?.oneOf;

    expect(options?.[0]).toMatchObject({
      ref: "#/components/schemas/Point",
      type: "object",
    });
  });
});
