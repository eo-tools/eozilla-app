import { isStringSchema } from "@/utils/json";
import { MapField } from "../MapField";
import { renderStringField } from "./stringRenderer";
import type { FieldFactory } from "../types";

export const stringFieldFactory: FieldFactory = {
  getScore(field) {
    if (!isStringSchema(field.schema) || field.schema.nullable) {
      return 0;
    }
    return field.widget === "map" ? 20 : 10;
  },
  render(ctx) {
    if (ctx.field.widget === "map") {
      return (
        <MapField
          field={ctx.field}
          value={String(ctx.value ?? "")}
          onChange={(nextValue) => ctx.onChange(nextValue)}
          hideLabel={ctx.hideLabel}
        />
      );
    }

    return renderStringField(ctx);
  },
};
