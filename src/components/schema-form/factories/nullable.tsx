import { Collapse, Stack, Switch } from "@mantine/core";

import { createJsonValueForSchema } from "@/utils/json";
import {
  getFieldDescription,
  getFieldLabel,
  getNonNullableField,
} from "../fieldUtils";
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

    return (
      <Stack gap="xs">
        <Switch
          label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
          description={getFieldDescription(ctx.field)}
          checked={enabled}
          onChange={(event) => {
            ctx.onChange(
              event.currentTarget.checked
                ? createJsonValueForSchema(innerField.schema)
                : null,
            );
          }}
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
