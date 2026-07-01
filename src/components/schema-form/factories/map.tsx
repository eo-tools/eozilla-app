import { isStringSchema, type JsonValue } from "@/utils/json";
import { MapField } from "../MapField";
import { isArrayField } from "../fieldUtils";
import type { FieldFactory, FieldRenderContext } from "../types";

export const mapFieldFactory: FieldFactory = {
  getScore(field) {
    return isMapField(field) ? 20 : 0;
  },
  render(ctx) {
    const isBBoxMap = isArrayField(ctx.field);
    if (isBBoxMap) {
      return renderBboxMapField(ctx);
    }
    return renderWktMapField(ctx);
  },
};

function renderBboxMapField(ctx: FieldRenderContext) {
  return (
    <MapField
      field={ctx.field}
      valueType="bbox"
      value={getBBoxValue(ctx.value)}
      onChange={(nextValue) => ctx.onChange(nextValue)}
      hideLabel={ctx.hideLabel}
    />
  );
}

function renderWktMapField(ctx: FieldRenderContext) {
  return (
    <MapField
      field={ctx.field}
      valueType="wkt"
      value={String(ctx.value ?? "")}
      onChange={(nextValue) => ctx.onChange(nextValue)}
      hideLabel={ctx.hideLabel}
    />
  );
}

function isMapField(field: Parameters<FieldFactory["getScore"]>[0]) {
  return (
    field.widget === "map" &&
    (isStringSchema(field.schema) || isArrayField(field))
  );
}

function getBBoxValue(value: JsonValue | undefined): number[] {
  return Array.isArray(value) ? (value as number[]) : [0, 0, 0, 0];
}
