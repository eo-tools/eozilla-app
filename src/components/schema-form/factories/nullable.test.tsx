import type { ComponentProps, ReactElement } from "react";
import { Stack } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";

import { getFieldFromSchema } from "@/utils/field";
import type { JsonSchema } from "@/utils/json";
import type { FieldRenderContext } from "../types";
import { nullableFieldFactory } from "./nullable";

type StackElement = ReactElement<ComponentProps<typeof Stack>>;

describe("nullableFieldFactory", () => {
  it("enables fields with a null default using a non-null fallback", () => {
    const onChange = vi.fn();
    const element = nullableFieldFactory.render(
      createContext({
        field: getFieldFromSchema("name", {
          type: "string",
          nullable: true,
          default: null,
        } as JsonSchema),
        value: null,
        onChange,
      }),
    ) as StackElement;

    const toggle = getToggle(element);
    toggle.props.onChange({ currentTarget: { checked: true } });

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("uses a non-null default when enabling a field", () => {
    const onChange = vi.fn();
    const element = nullableFieldFactory.render(
      createContext({
        field: getFieldFromSchema("name", {
          type: "string",
          nullable: true,
          default: "Anonymous",
        } as JsonSchema),
        value: null,
        onChange,
      }),
    ) as StackElement;

    const toggle = getToggle(element);
    toggle.props.onChange({ currentTarget: { checked: true } });

    expect(onChange).toHaveBeenCalledWith("Anonymous");
  });
});

function getToggle(element: StackElement) {
  const [toggle] = element.props.children as unknown as ReactElement<{
    onChange: (event: { currentTarget: { checked: boolean } }) => void;
  }>[];
  return toggle!;
}

function createContext(
  overrides: Partial<FieldRenderContext> &
    Pick<FieldRenderContext, "field" | "onChange">,
): FieldRenderContext {
  return {
    field: overrides.field,
    value: overrides.value,
    onChange: overrides.onChange,
    path: ["test"],
    valuePath: ["test"],
    disabled: false,
    generator: {
      renderField: () => <div />,
    },
  };
}
