import type { ComponentProps, ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { ArrayField } from "../ArrayField";
import { getFieldFromSchema } from "@/utils/field";
import type { JsonSchema } from "@/utils/json";
import { arrayFieldFactory } from "./array";
import type { FieldRenderContext } from "../types";

type ArrayFieldElement = ReactElement<ComponentProps<typeof ArrayField>>;

describe("arrayFieldFactory", () => {
  it("scores non-nullable array fields", () => {
    const field = getFieldFromSchema("tags", {
      type: "array",
      items: { type: "string" },
    } as JsonSchema);

    expect(arrayFieldFactory.getScore(field)).toBe(12);
  });

  it("does not score map arrays", () => {
    const field = getFieldFromSchema("bbox", {
      type: "array",
      items: { type: "number" },
      minItems: 4,
      maxItems: 4,
      "x-ui-widget": "map",
    } as JsonSchema);

    expect(arrayFieldFactory.getScore(field)).toBe(0);
  });

  it("renders simple primitive arrays as separator-based input fields", () => {
    const field = getFieldFromSchema("tags", {
      type: "array",
      items: { type: "string" },
    } as JsonSchema);

    const element = arrayFieldFactory.render(
      createContext({
        field,
        value: ["one", "two"],
        onChange: vi.fn(),
      }),
    ) as ArrayFieldElement;

    expect(element.type).toBe(ArrayField);
    expect(element.props.mode).toBe("input");
    expect(element.props.separator).toBe(", ");
  });

  it("renders custom separators from schema metadata", () => {
    const field = getFieldFromSchema("tags", {
      type: "array",
      items: { type: "string" },
      "x-ui-separator": "; ",
    } as JsonSchema);

    const element = arrayFieldFactory.render(
      createContext({
        field,
        value: ["one", "two"],
        onChange: vi.fn(),
      }),
    ) as ArrayFieldElement;

    expect(element.props.separator).toBe("; ");
  });

  it("does not score enum arrays without an explicit editor widget", () => {
    const field = getFieldFromSchema("colors", {
      type: "array",
      items: {
        type: "string",
        enum: ["red", "green"],
      },
    } as JsonSchema);

    expect(arrayFieldFactory.getScore(field)).toBe(0);
  });

  it("renders date arrays as separator-based input fields", () => {
    const field = getFieldFromSchema("date_range", {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "string",
        format: "date",
      },
    } as JsonSchema);

    const element = arrayFieldFactory.render(
      createContext({
        field,
        value: ["2026-01-01", "2026-01-31"],
        onChange: vi.fn(),
      }),
    ) as ArrayFieldElement;

    expect(element.props.mode).toBe("input");
  });

  it("renders date-time arrays as separator-based input fields", () => {
    const field = getFieldFromSchema("datetime_range", {
      type: "array",
      minItems: 2,
      maxItems: 2,
      items: {
        type: "string",
        format: "date-time",
      },
    } as JsonSchema);

    const element = arrayFieldFactory.render(
      createContext({
        field,
        value: ["2026-01-01T10:00:00", "2026-01-01T12:00:00"],
        onChange: vi.fn(),
      }),
    ) as ArrayFieldElement;

    expect(element.props.mode).toBe("input");
  });

  it("does not render date-time item arrays as editors without an explicit editor widget", () => {
    const field = getFieldFromSchema("datetime_array", {
      type: "array",
      items: {
        type: "string",
        format: "date-time",
      },
    } as JsonSchema);

    const element = arrayFieldFactory.render(
      createContext({
        field,
        value: ["2026-01-01T10:00:00"],
        onChange: vi.fn(),
      }),
    ) as ArrayFieldElement;

    expect(element.props.mode).toBe("input");
  });

  it("does not score object arrays without an explicit editor widget", () => {
    const field = getFieldFromSchema("objects", {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
      },
    } as JsonSchema);

    expect(arrayFieldFactory.getScore(field)).toBe(0);
  });

  it("renders arrays with an explicit editor widget as editors", () => {
    const field = getFieldFromSchema("colors", {
      type: "array",
      "x-ui": {
        widget: "editor",
      },
      items: {
        type: "string",
        enum: ["red", "green"],
      },
    } as JsonSchema);

    const element = arrayFieldFactory.render(
      createContext({
        field,
        value: ["red"],
        onChange: vi.fn(),
      }),
    ) as ArrayFieldElement;

    expect(element.props.mode).toBe("editor");
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
