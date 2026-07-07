import { NumberInput, Slider } from "@mantine/core";

import { isNumberSchema } from "@/utils/json";
import { type NumericSchema } from "@/utils/json";
import { FieldShell } from "../FieldShell";
import {
  getFieldDescription,
  getFieldLabel,
  getFieldValue,
} from "../fieldUtils";
import type { FieldFactory, FieldRenderContext } from "../types";
import { renderEnumSelect } from "./enum";

export const numberFieldFactory: FieldFactory = {
  getScore(field) {
    return isNumberSchema(field.schema) && !field.schema.nullable ? 10 : 0;
  },
  render: renderNumericField,
};

export function renderNumericField(ctx: FieldRenderContext) {
  const schema = ctx.field.schema as NumericSchema;
  const value = coerceNumber(getFieldValue(ctx.field, ctx.value));

  if (schema.enum) {
    return renderEnumSelect(ctx, value);
  }

  if (
    ctx.field.widget === "slider" &&
    Number.isFinite(getMinimum(ctx)) &&
    Number.isFinite(getMaximum(ctx)) &&
    (getMinimum(ctx) as number) < (getMaximum(ctx) as number)
  ) {
    return (
      <FieldShell field={ctx.field} hideLabel={ctx.hideLabel}>
        <Slider
          value={value}
          min={getMinimum(ctx)}
          max={getMaximum(ctx)}
          step={getStep(ctx)}
          onChange={(nextValue) =>
            ctx.onChange(normalizeNumber(ctx, nextValue))
          }
        />
      </FieldShell>
    );
  }

  return (
    <NumberInput
      label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
      description={getFieldDescription(ctx.field)}
      value={value}
      min={getMinimum(ctx)}
      max={getMaximum(ctx)}
      step={getStep(ctx)}
      decimalScale={schema.type === "integer" ? 0 : undefined}
      onChange={(nextValue) => {
        if (typeof nextValue === "number") {
          ctx.onChange(normalizeNumber(ctx, nextValue));
        }
      }}
    />
  );
}

function coerceNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeNumber(ctx: FieldRenderContext, value: number) {
  return ctx.field.schema.type === "integer" ? Math.round(value) : value;
}

function getMinimum(ctx: FieldRenderContext): number | undefined {
  return ctx.field.minimum ?? (ctx.field.schema as NumericSchema).minimum;
}

function getMaximum(ctx: FieldRenderContext): number | undefined {
  return ctx.field.maximum ?? (ctx.field.schema as NumericSchema).maximum;
}

function getStep(ctx: FieldRenderContext): number | undefined {
  return ctx.field.step ?? (ctx.field.schema as NumericSchema).multipleOf;
}
