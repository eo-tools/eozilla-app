import { PasswordInput, Textarea, TextInput } from "@mantine/core";
import { DatePickerInput, DateTimePicker, TimeInput } from "@mantine/dates";
import dayjs from "dayjs";

import { type StringSchema } from "@/utils/json";
import { getFieldDescription, getFieldLabel, getFieldValue } from "../fieldUtils";
import type { FieldRenderContext } from "../types";
import { renderEnumSelect } from "./enumFieldRenderer";

export function renderStringField(ctx: FieldRenderContext) {
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
