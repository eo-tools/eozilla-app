import { Tabs } from "@mantine/core";
import { useState } from "react";

import {
  createJsonValueForSchema,
  withCompositionDiscriminatorValue,
  type JsonValue,
} from "@/utils/json";
import { getFieldLabel } from "./fieldUtils";
import { FieldShell } from "./FieldShell";
import type { Field } from "@/utils/field";
import type { FieldRenderContext } from "./types";
import { findActiveOptionIndex } from "./selectiveCompositionUtils";

export function SelectiveCompositionField({
  ctx,
  options,
}: {
  ctx: FieldRenderContext;
  options: Field[];
}) {
  const discriminator = ctx.field.schema.discriminator;
  const activeIndex = findActiveOptionIndex(ctx.value, options, discriminator);
  const [optionValues, setOptionValues] = useState<JsonValue[]>(() =>
    options.map((option, index) =>
      index === activeIndex && ctx.value !== undefined
        ? ctx.value
        : createJsonValueForSchema(option.schema),
    ),
  );
  const activeOption = options[activeIndex] ?? options[0]!;
  const activeValue =
    ctx.value ??
    optionValues[activeIndex] ??
    createJsonValueForSchema(activeOption.schema);

  return (
    <FieldShell field={ctx.field} hideLabel={ctx.hideLabel}>
      <Tabs
        value={String(activeIndex)}
        onChange={(value) => {
          if (ctx.disabled) {
            return;
          }
          const nextIndex = Number(value ?? "0");
          const nextOption = options[nextIndex] ?? options[0]!;
          const nextValue = withCompositionDiscriminatorValue(
            optionValues[nextIndex] ??
              createJsonValueForSchema(nextOption.schema),
            nextOption.schema,
            discriminator,
            nextIndex,
          );
          setOptionValues((current) => {
            const next = [...current];
            next[nextIndex] = nextValue;
            return next;
          });
          ctx.onChange(nextValue);
        }}
      >
        <Tabs.List>
          {options.map((option, index) => (
            <Tabs.Tab
              key={option.name}
              value={String(index)}
              disabled={ctx.disabled}
            >
              {getFieldLabel(option)}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        <Tabs.Panel value={String(activeIndex)}>
          {ctx.generator.renderField(
            activeOption,
            activeValue,
            (nextValue) => {
              setOptionValues((current) => {
                const next = [...current];
                next[activeIndex] = nextValue;
                return next;
              });
              ctx.onChange(nextValue);
            },
            {
              hideLabel: true,
              hideAdvanced: ctx.hideAdvanced,
              path: [...ctx.path, String(activeIndex)],
              valuePath: ctx.valuePath,
              index: ctx.index,
              disabled: ctx.disabled,
            },
          )}
        </Tabs.Panel>
      </Tabs>
    </FieldShell>
  );
}
