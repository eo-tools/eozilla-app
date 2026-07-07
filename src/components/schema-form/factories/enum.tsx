import {
  Group,
  Radio,
  SegmentedControl,
  Select,
  Stack,
} from "@mantine/core";

import type { JsonValue } from "@/utils/json";
import { FieldShell } from "../FieldShell";
import { getFieldDescription, getFieldLabel } from "../fieldUtils";
import type { FieldRenderContext } from "../types";

export function renderEnumSelect(ctx: FieldRenderContext, value: JsonValue) {
  const enumValues = ctx.field.schema.enum ?? [];
  const data = enumValues.map((item) => ({
    value: encodeEnumValue(item),
    label: formatEnumLabel(item),
  }));

  if (
    ctx.field.widget === "radio" ||
    ctx.field.widget === "radio-column" ||
    ctx.field.widget === "radio-row"
  ) {
    const layout = ctx.field.widget === "radio-row" ? "row" : "column";
    return (
      <Radio.Group
        label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
        description={getFieldDescription(ctx.field)}
        value={encodeEnumValue(value)}
        onChange={(nextValue) => {
          ctx.onChange(decodeEnumValue(nextValue));
        }}
      >
        {layout === "row" ? (
          <Group gap="xs" mt="xs">
            {data.map((item) => (
              <Radio key={item.value} value={item.value} label={item.label} size="xs" />
            ))}
          </Group>
        ) : (
          <Stack gap="xs" mt="xs">
            {data.map((item) => (
              <Radio key={item.value} value={item.value} label={item.label} size="xs" />
            ))}
          </Stack>
        )}
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

function encodeEnumValue(value: JsonValue): string {
  return JSON.stringify(value);
}

function decodeEnumValue(value: string): JsonValue {
  return JSON.parse(value) as JsonValue;
}

function formatEnumLabel(value: JsonValue): string {
  return typeof value === "string" ? value : JSON.stringify(value);
}
