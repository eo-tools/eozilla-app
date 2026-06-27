import { Radio, SegmentedControl } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import type { ReactElement } from "react";

import { getFieldFromSchema } from "@/utils/field";
import type { JsonSchema } from "@/utils/json";
import { primitiveFieldFactory } from "./primitive";
import type { FieldRenderContext } from "../types";

describe("primitiveFieldFactory", () => {
  it("renders enum fields with x-ui-widget radio as radio groups", () => {
    const field = getFieldFromSchema("quality", {
      type: "string",
      enum: ["low", "high"],
      "x-ui-widget": "radio",
    } as JsonSchema);

    const element = primitiveFieldFactory.render({
      field,
      value: "high",
      onChange: vi.fn(),
      path: ["quality"],
      generator: {
        renderField: () => {
          throw new Error("not used");
        },
      },
    } satisfies FieldRenderContext);

    expect(element.type).toBe(Radio.Group);
  });

  it("renders numeric enum radio fields as radio groups", () => {
    const field = getFieldFromSchema("count", {
      type: "integer",
      enum: [1, 2],
      "x-ui-widget": "radio",
    } as JsonSchema);

    const element = primitiveFieldFactory.render({
      field,
      value: 1,
      onChange: vi.fn(),
      path: ["count"],
      generator: {
        renderField: () => {
          throw new Error("not used");
        },
      },
    } satisfies FieldRenderContext);

    expect(element.type).toBe(Radio.Group);
  });

  it("renders enum fields with x-ui-widget button as segmented controls", () => {
    const field = getFieldFromSchema("quality", {
      type: "string",
      enum: ["low", "high"],
      "x-ui-widget": "button",
    } as JsonSchema);

    const element = primitiveFieldFactory.render({
      field,
      value: "low",
      onChange: vi.fn(),
      path: ["quality"],
      generator: {
        renderField: () => {
          throw new Error("not used");
        },
      },
    } satisfies FieldRenderContext);

    const child = (element as ReactElement<{ children: ReactElement }>).props
      .children;
    expect(child.type).toBe(SegmentedControl);
  });
});
