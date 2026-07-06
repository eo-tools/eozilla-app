import { Tabs } from "@mantine/core";
import { useState } from "react";

import {
  createJsonValueForSchema,
  getCompositionOptionDiscriminatorValue,
  isJsonObjectValue,
  withCompositionDiscriminatorValue,
  validateJsonValue,
  type Discriminator,
  type JsonValue,
} from "@/utils/json";
import { FieldShell } from "../FieldShell";
import { getFieldLabel } from "../fieldUtils";
import type { Field } from "@/utils/field";
import type { FieldRenderContext } from "../types";

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
          const nextIndex = Number(value ?? "0");
          const nextOption = options[nextIndex] ?? options[0]!;
          const nextValue = withCompositionDiscriminatorValue(
            optionValues[nextIndex] ?? createJsonValueForSchema(nextOption.schema),
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
            <Tabs.Tab key={option.name} value={String(index)}>
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
            },
          )}
        </Tabs.Panel>
      </Tabs>
    </FieldShell>
  );
}

function findActiveOptionIndex(
  value: JsonValue | undefined,
  options: Field[],
  discriminator: Discriminator | undefined,
) {
  if (value === undefined) {
    return 0;
  }

  if (discriminator && isJsonObjectValue(value)) {
    const discriminatorValue = value[discriminator.propertyName];
    if (typeof discriminatorValue === "string") {
      const index = options.findIndex(
        (option, optionIndex) =>
          getCompositionOptionDiscriminatorValue(
            option.schema,
            discriminator,
            optionIndex,
          ) ===
          discriminatorValue,
      );
      if (index >= 0) {
        return index;
      }
    }
  }

  const index = options.findIndex((option) => {
    try {
      validateJsonValue(option.name, value, option.schema);
      return true;
    } catch {
      return false;
    }
  });
  return index >= 0 ? index : 0;
}
