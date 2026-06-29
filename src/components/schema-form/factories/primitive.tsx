import {
  Checkbox,
  NumberInput,
  PasswordInput,
  Radio,
  SegmentedControl,
  Select,
  Slider,
  Switch,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePickerInput, DateTimePicker, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";

import {
  isBooleanSchema,
  isNumericSchema,
  isStringSchema,
  type NumericSchema,
  type JsonValue,
  type StringSchema,
} from "@/utils/json";
import { FieldShell } from "../FieldShell";
import {
  getFieldDescription,
  getFieldLabel,
  getFieldValue,
  isPrimitiveField,
} from "../fieldUtils";
import type { FieldFactory, FieldRenderContext } from "../types";

export const primitiveFieldFactory: FieldFactory = {
  getScore(field) {
    return isPrimitiveField(field) && !field.schema.nullable ? 10 : 0;
  },
  render(ctx) {
    const schema = ctx.field.schema;
    if (isBooleanSchema(schema)) {
      return renderBooleanField(ctx);
    }
    if (isNumericSchema(schema)) {
      return renderNumericField(ctx);
    }
    if (isStringSchema(schema)) {
      return renderStringField(ctx);
    }
    throw new Error(`Unsupported primitive field '${ctx.field.name}'.`);
  },
};

function renderBooleanField(ctx: FieldRenderContext) {
  const value = getFieldValue(ctx.field, ctx.value) === true;
  const Control = ctx.field.widget === "switch" ? Switch : Checkbox;
  return (
    <Control
      label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
      description={getFieldDescription(ctx.field)}
      checked={value}
      onChange={(event) => ctx.onChange(event.currentTarget.checked)}
    />
  );
}

function renderNumericField(ctx: FieldRenderContext) {
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

function renderStringField(ctx: FieldRenderContext) {
  const schema = ctx.field.schema as StringSchema;
  const value = String(getFieldValue(ctx.field, ctx.value) ?? "");

  if (schema.enum) {
    return renderEnumSelect(ctx, value);
  }

  if (schema.format === "date") {
    return renderDateField(ctx, value);
  }

  if (schema.format === "time") {
    return renderTimeField(ctx, value);
  }

  if (schema.format === "date-time") {
    return renderDateTimeField(ctx, value);
  }

  if (schema.format === "password" || ctx.field.password) {
    return (
      <PasswordInput
        label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
        description={getFieldDescription(ctx.field)}
        placeholder={ctx.field.placeholder}
        value={value}
        onChange={(event) => ctx.onChange(event.currentTarget.value)}
      />
    );
  }

  if (ctx.field.widget === "textarea") {
    return (
      <Textarea
        label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
        description={getFieldDescription(ctx.field)}
        placeholder={ctx.field.placeholder}
        autosize
        minRows={2}
        maxRows={8}
        value={value}
        onChange={(event) => ctx.onChange(event.currentTarget.value)}
      />
    );
  }

  return (
    <TextInput
      label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
      description={getFieldDescription(ctx.field)}
      placeholder={ctx.field.placeholder}
      value={value}
      onChange={(event) => ctx.onChange(event.currentTarget.value)}
    />
  );
}

function renderDateField(ctx: FieldRenderContext, value: string) {
  return (
    <DatePickerInput
      label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
      description={getFieldDescription(ctx.field)}
      placeholder={ctx.field.placeholder}
      value={toDateValue(value)}
      valueFormat="YYYY-MM-DD"
      clearable={Boolean(ctx.field.schema.nullable)}
      onChange={(nextValue) => {
        ctx.onChange(nextValue ?? "");
      }}
    />
  );
}

function renderTimeField(ctx: FieldRenderContext, value: string) {
  return (
    <TimeInput
      label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
      description={getFieldDescription(ctx.field)}
      placeholder={ctx.field.placeholder}
      value={toTimeValue(value)}
      withSeconds
      onChange={(event) => {
        ctx.onChange(event.currentTarget.value);
      }}
    />
  );
}

function renderDateTimeField(ctx: FieldRenderContext, value: string) {
  return (
    <DateTimePicker
      label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
      description={getFieldDescription(ctx.field)}
      placeholder={ctx.field.placeholder}
      value={toDateTimePickerValue(value)}
      valueFormat="YYYY-MM-DD HH:mm:ss"
      withSeconds
      clearable={Boolean(ctx.field.schema.nullable)}
      onChange={(nextValue: string | null) => {
        ctx.onChange(nextValue ? fromDateTimePickerValue(nextValue) : "");
      }}
    />
  );
}

function renderEnumSelect(ctx: FieldRenderContext, value: JsonValue) {
  const enumValues = ctx.field.schema.enum ?? [];
  const data = enumValues.map((item) => ({
    value: encodeEnumValue(item),
    label: formatEnumLabel(item),
  }));

  if (ctx.field.widget === "radio") {
    return (
      <Radio.Group
        label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
        description={getFieldDescription(ctx.field)}
        value={encodeEnumValue(value)}
        onChange={(nextValue) => {
          ctx.onChange(decodeEnumValue(nextValue));
        }}
      >
        {data.map((item) => (
          <Radio key={item.value} value={item.value} label={item.label} />
        ))}
      </Radio.Group>
    );
  }

  if (ctx.field.widget === "button") {
    return (
      <FieldShell field={ctx.field} hideLabel={ctx.hideLabel}>
        <SegmentedControl
          value={encodeEnumValue(value)}
          data={data}
          onChange={(nextValue) => {
            ctx.onChange(decodeEnumValue(nextValue));
          }}
        />
      </FieldShell>
    );
  }

  return (
    <Select
      label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
      description={getFieldDescription(ctx.field)}
      value={encodeEnumValue(value)}
      data={data}
      allowDeselect={false}
      onChange={(nextValue) => {
        if (nextValue !== null) {
          ctx.onChange(decodeEnumValue(nextValue));
        }
      }}
    />
  );
}

function coerceNumber(value: JsonValue): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeNumber(ctx: FieldRenderContext, value: number): JsonValue {
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

function encodeEnumValue(value: JsonValue): string {
  return JSON.stringify(value);
}

function decodeEnumValue(value: string): JsonValue {
  return JSON.parse(value) as JsonValue;
}

function formatEnumLabel(value: JsonValue): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}

function toDateValue(value: string): string | null {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
}

function toTimeValue(value: string): string {
  const match = value.match(/^(\d{2}:\d{2})(?::(\d{2}))?/);
  if (!match) {
    return "";
  }
  return `${match[1]}:${match[2] ?? "00"}`;
}

function toDateTimePickerValue(value: string): string | null {
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD HH:mm:ss") : null;
}

function fromDateTimePickerValue(value: string): string {
  return value.replace(" ", "T");
}
