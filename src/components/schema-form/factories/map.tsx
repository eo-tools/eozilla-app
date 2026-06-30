import { isStringSchema } from "@/utils/json";
import { MapField } from "../MapField";
import type { FieldFactory } from "../types";

export const mapFieldFactory: FieldFactory = {
  getScore(field) {
    return isMapField(field) ? 20 : 0;
  },
  render(ctx) {
    return (
      <MapField
        field={ctx.field}
        value={String(ctx.value ?? "")}
        onChange={(nextValue) => ctx.onChange(nextValue)}
        hideLabel={ctx.hideLabel}
      />
    );
  },
};

function isMapField(field: Parameters<FieldFactory["getScore"]>[0]) {
  return isStringSchema(field.schema) && field.widget === "map";
}
