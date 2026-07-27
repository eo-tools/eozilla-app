import { Checkbox, Switch } from "@mantine/core";

import { isBooleanSchema } from "@/utils/json";
import {
  getFieldDescription,
  getFieldLabel,
  getFieldValue,
} from "../fieldUtils";
import type { FieldRenderContext, FieldFactory } from "../types";

export const booleanFieldFactory: FieldFactory = {
  getScore(field) {
    return isBooleanSchema(field.schema) && !field.schema.nullable ? 10 : 0;
  },
  render: renderBooleanField,
};

function renderBooleanField(ctx: FieldRenderContext) {
  const value = getFieldValue(ctx.field, ctx.value) === true;
  const Control = ctx.field.widget === "switch" ? Switch : Checkbox;
  return (
    <Control
      label={ctx.hideLabel ? undefined : getFieldLabel(ctx.field)}
      description={getFieldDescription(ctx.field)}
      checked={value}
      disabled={ctx.disabled}
      onChange={(event) => ctx.onChange(event.currentTarget.checked)}
    />
  );
}
