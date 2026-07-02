import type { ComponentProps, ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { getFieldFromSchema } from "@/utils/field";
import type { JsonSchema } from "@/utils/json";
import { MapField } from "../MapField";
import { mapFieldFactory } from "./map";
import type { FieldRenderContext } from "../types";

type MapFieldElement = ReactElement<ComponentProps<typeof MapField>>;

describe("mapFieldFactory", () => {
  it("scores string map fields", () => {
    const field = getFieldFromSchema("geometry", {
      type: "string",
      "x-ui-widget": "map",
    } as JsonSchema);

    expect(mapFieldFactory.getScore(field)).toBe(20);
  });

  it("scores array map fields", () => {
    const field = getFieldFromSchema("bbox", {
      type: "array",
      items: { type: "number" },
      minItems: 4,
      maxItems: 4,
      "x-ui-widget": "map",
    } as JsonSchema);

    expect(mapFieldFactory.getScore(field)).toBe(20);
  });

  it("ignores non-map widgets", () => {
    const field = getFieldFromSchema("geometry", {
      type: "string",
    } as JsonSchema);

    expect(mapFieldFactory.getScore(field)).toBe(0);
  });

  it("renders string map fields as WKT map fields", () => {
    const field = getFieldFromSchema("geometry", {
      type: "string",
      "x-ui-widget": "map",
    } as JsonSchema);
    const onChange = vi.fn();

    const element = mapFieldFactory.render(
      createContext({
        field,
        value: "POLYGON((0 0,1 0,1 1,0 1,0 0))",
        onChange,
      }),
    ) as MapFieldElement;

    expect(element.type).toBe(MapField);
    expect(element.props.valueType).toBe("wkt");
    expect(element.props.value).toBe("POLYGON((0 0,1 0,1 1,0 1,0 0))");

    element.props.onChange("POLYGON((1 1,2 1,2 2,1 2,1 1))");
    expect(onChange).toHaveBeenCalledWith("POLYGON((1 1,2 1,2 2,1 2,1 1))");
  });

  it("renders array map fields as bbox map fields", () => {
    const field = getFieldFromSchema("bbox", {
      type: "array",
      items: { type: "number" },
      minItems: 4,
      maxItems: 4,
      "x-ui-widget": "map",
    } as JsonSchema);
    const onChange = vi.fn();

    const element = mapFieldFactory.render(
      createContext({
        field,
        value: [7, 48, 8, 49],
        onChange,
      }),
    ) as MapFieldElement;

    expect(element.type).toBe(MapField);
    expect(element.props.valueType).toBe("bbox");
    expect(element.props.value).toEqual([7, 48, 8, 49]);

    element.props.onChange([8, 49, 9, 50]);
    expect(onChange).toHaveBeenCalledWith([8, 49, 9, 50]);
  });

  it("falls back to an empty bbox when the current value is missing", () => {
    const field = getFieldFromSchema("bbox", {
      type: "array",
      items: { type: "number" },
      minItems: 4,
      maxItems: 4,
      "x-ui-widget": "map",
    } as JsonSchema);

    const element = mapFieldFactory.render(
      createContext({
        field,
        value: undefined,
        onChange: vi.fn(),
      }),
    ) as MapFieldElement;

    expect(element.props.value).toEqual([0, 0, 0, 0]);
  });
});

function createContext(
  overrides: Partial<FieldRenderContext> & Pick<FieldRenderContext, "field" | "onChange">,
): FieldRenderContext {
  return {
    field: overrides.field,
    value: overrides.value,
    onChange: overrides.onChange,
    path: ["test"],
    hideLabel: overrides.hideLabel,
    generator: {
      renderField: () => {
        throw new Error("not used");
      },
    },
  };
}
