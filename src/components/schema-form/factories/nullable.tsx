import { Collapse, Input, Stack, Switch } from "@mantine/core";
import { createJsonValueForSchema } from "@/utils/json";
import { getFieldLabel, getNonNullableField } from "../fieldUtils";
import type { FieldFactory } from "../types";

export const nullableFieldFactory: FieldFactory = {
  getScore(field) {
    return field.schema.nullable ? 100 : 0;
  },
  render(ctx) {
    const innerField = getNonNullableField(ctx.field);
    const enabled = ctx.value !== null;
    const innerValue =
      ctx.value === null || ctx.value === undefined
        ? createJsonValueForSchema(innerField.schema)
        : ctx.value;
    const handleToggle = (checked: boolean) => {
      ctx.onChange(
        checked ? createJsonValueForSchema(innerField.schema) : null,
      );
    };

    return (
      <Stack gap={4}>
        <Switch
          label={
            ctx.hideLabel ? undefined : (
              <Input.Label component="span">
                {getFieldLabel(ctx.field)}
              </Input.Label>
            )
          }
          size="xs"
          checked={enabled}
          onChange={(event) => handleToggle(event.currentTarget.checked)}
        />
        <Collapse expanded={enabled}>
          {ctx.generator.renderField(innerField, innerValue, ctx.onChange, {
            hideLabel: true,
            hideAdvanced: ctx.hideAdvanced,
            path: ctx.path,
          })}
        </Collapse>
      </Stack>
    );
  },
};
