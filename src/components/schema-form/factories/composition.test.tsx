import { describe, expect, it, vi } from "vitest";

import { SelectiveCompositionField } from "../SelectiveCompositionField";
import { findActiveOptionIndex } from "../selectiveCompositionUtils";
import { getFieldFromSchema } from "@/utils/field";
import type { JsonSchema } from "@/utils/json";
import { compositionFieldFactory } from "./composition";
import type { FieldRenderContext } from "../types";

describe("compositionFieldFactory", () => {
  it("scores untyped composition fields", () => {
    expect(
      compositionFieldFactory.getScore(
        getFieldFromSchema("value", {
          oneOf: [{ type: "string" }, { type: "number" }],
        } as JsonSchema),
      ),
    ).toBe(5);
    expect(
      compositionFieldFactory.getScore(
        getFieldFromSchema("value", {
          anyOf: [{ type: "string" }, { type: "number" }],
        } as JsonSchema),
      ),
    ).toBe(5);
    expect(
      compositionFieldFactory.getScore(
        getFieldFromSchema("value", {
          allOf: [{ type: "object" }, { type: "object" }],
        } as JsonSchema),
      ),
    ).toBe(5);
  });

  it("does not score typed fields before their type factory", () => {
    expect(
      compositionFieldFactory.getScore(
        getFieldFromSchema("value", {
          type: "object",
          oneOf: [{ type: "string" }],
        } as JsonSchema),
      ),
    ).toBe(0);
  });

  it("renders oneOf and anyOf as single active option tab fields", () => {
    const field = getFieldFromSchema("source", {
      oneOf: [
        { title: "S3 Object", type: "object", properties: {} },
        { title: "File Upload", type: "object", properties: {} },
      ],
    } as JsonSchema);
    const onChange = vi.fn();

    const element = compositionFieldFactory.render(
      createContext({
        field,
        value: {},
        onChange,
      }),
    );

    expect(element.type).toBe(SelectiveCompositionField);
    expect((element.props as { options: unknown[] }).options).toHaveLength(2);
  });

  it("merges allOf fields before rendering the child field", () => {
    const field = getFieldFromSchema("source", {
      allOf: [
        {
          type: "object",
          title: "Product",
          description: "Product settings",
          additionalProperties: false,
          required: ["bucket"],
          properties: {
            bucket: { type: "string" },
          },
        },
        {
          type: "object",
          title: "Processing",
          description: "Processing settings",
          additionalProperties: false,
          required: ["object"],
          properties: {
            object: { type: "string" },
          },
        },
      ],
    } as JsonSchema);
    const renderField = vi.fn(() => <div />);

    compositionFieldFactory.render(
      createContext({
        field,
        value: {},
        onChange: vi.fn(),
        generator: { renderField },
      }),
    );

    expect(renderField).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "source",
        properties: expect.objectContaining({
          bucket: expect.anything(),
          object: expect.anything(),
        }),
        schema: expect.objectContaining({
          type: "object",
        }),
      }),
      {},
      expect.any(Function),
      expect.objectContaining({ hideLabel: true }),
    );
  });

  it("writes discriminator values when switching options", () => {
    const field = getFieldFromSchema("geometry", {
      oneOf: [
        {
          ref: "#/components/schemas/Point",
          type: "object",
          properties: { type: { type: "string" } },
        },
        {
          ref: "#/components/schemas/LineString",
          type: "object",
          properties: { type: { type: "string" } },
        },
      ],
      discriminator: {
        propertyName: "type",
        mapping: {
          pt: "#/components/schemas/Point",
          ls: "#/components/schemas/LineString",
        },
      },
    } as JsonSchema);
    const onChange = vi.fn();

    const element = compositionFieldFactory.render(
      createContext({
        field,
        value: { type: "pt" },
        onChange,
      }),
    );

    expect(element.type).toBe(SelectiveCompositionField);
    expect(
      (element.props as { options: { schema: { ref?: string } }[] }).options[1]
        ?.schema.ref,
    ).toBe("#/components/schemas/LineString");
  });

  it("picks the matching anyOf option when other options disallow extra properties", () => {
    const field = getFieldFromSchema("source", {
      anyOf: [
        {
          type: "object",
          title: "S3 Object",
          additionalProperties: false,
          properties: {
            bucket: { type: "string" },
            object: { type: "string" },
          },
        },
        {
          type: "object",
          title: "Inline Text",
          additionalProperties: false,
          properties: {
            text: { type: "string" },
          },
        },
      ],
    } as JsonSchema);

    expect(
      findActiveOptionIndex(
        { text: "manual input" },
        "anyOf" in field ? field.anyOf : [],
        undefined,
      ),
    ).toBe(1);
  });
});

function createContext(
  overrides: Partial<FieldRenderContext> &
    Pick<FieldRenderContext, "field" | "onChange">,
): FieldRenderContext {
  return {
    field: overrides.field,
    value: overrides.value,
    onChange: overrides.onChange,
    path: ["test"],
    hideLabel: overrides.hideLabel,
    generator: overrides.generator ?? {
      renderField: () => <div />,
    },
  };
}
