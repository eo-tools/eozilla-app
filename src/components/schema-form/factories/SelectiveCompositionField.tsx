import { Tabs } from "@mantine/core";
import { useState } from "react";

import {
  createJsonValueForSchema,
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
  const initialIndex = findActiveOptionIndex(ctx.value, options, discriminator);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [optionValues, setOptionValues] = useState<JsonValue[]>(() =>
    options.map((option, index) =>
      index === initialIndex && ctx.value !== undefined
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
          const nextValue = withDiscriminatorValue(
            optionValues[nextIndex] ?? createJsonValueForSchema(nextOption.schema),
            nextOption,
            discriminator,
            nextIndex,
          );
          setActiveIndex(nextIndex);
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
          getOptionDiscriminatorValue(option, discriminator, optionIndex) ===
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

function withDiscriminatorValue(
  value: JsonValue,
  option: Field,
  discriminator: Discriminator | undefined,
  optionIndex: number,
): JsonValue {
  if (!discriminator || !isJsonObjectValue(value)) {
    return value;
  }

  return {
    ...value,
    [discriminator.propertyName]: getOptionDiscriminatorValue(
      option,
      discriminator,
      optionIndex,
    ),
  };
}

function getOptionDiscriminatorValue(
  option: Field,
  discriminator: Discriminator,
  optionIndex: number,
): string {
  const optionRef = option.schema.ref;
  if (optionRef && discriminator.mapping) {
    const mapped = Object.entries(discriminator.mapping).find(
      ([, ref]) => ref === optionRef,
    );
    if (mapped) {
      return mapped[0];
    }
  }

  return optionRef?.split("/").pop() ?? String(optionIndex);
}

function isJsonObjectValue(value: JsonValue): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
