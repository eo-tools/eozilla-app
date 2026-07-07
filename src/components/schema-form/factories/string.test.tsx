import type { ComponentProps, ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { getFieldFromSchema } from "@/utils/field";
import type { JsonSchema } from "@/utils/json";
import { MapField } from "../MapField";
import { stringFieldFactory } from "./string";
import type { FieldRenderContext } from "../types";

type MapFieldElement = ReactElement<ComponentProps<typeof MapField>>;

describe("stringFieldFactory", () => {
  it("scores string map fields", () => {
    const field = getFieldFromSchema("geometry", {
      type: "string",
      "x-ui-widget": "map",
    } as JsonSchema);

    expect(stringFieldFactory.getScore(field)).toBe(20);
  });

  it("renders string map fields as WKT map fields", () => {
    const field = getFieldFromSchema("geometry", {
      type: "string",
      "x-ui-widget": "map",
    } as JsonSchema);
    const onChange = vi.fn();

    const element = stringFieldFactory.render(
      createContext({
        field,
        value: "POLYGON((0 0,1 0,1 1,0 1,0 0))",
        onChange,
      }),
    ) as MapFieldElement;

    expect(element.type).toBe(MapField);
    expect(element.props.valueType).toBeUndefined();
    expect(element.props.value).toBe("POLYGON((0 0,1 0,1 1,0 1,0 0))");

    element.props.onChange("POLYGON((1 1,2 1,2 2,1 2,1 1))");
    expect(onChange).toHaveBeenCalledWith("POLYGON((1 1,2 1,2 2,1 2,1 1))");
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
    generator: {
      renderField: () => {
        throw new Error("not used");
      },
    },
  };
}
