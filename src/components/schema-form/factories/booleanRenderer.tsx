import { Checkbox, Switch } from "@mantine/core";

import { getFieldDescription, getFieldLabel, getFieldValue } from "../fieldUtils";
import type { FieldRenderContext } from "../types";

export function renderBooleanField(ctx: FieldRenderContext) {
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
