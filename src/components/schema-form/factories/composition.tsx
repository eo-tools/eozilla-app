import {
  getFieldFromSchema,
  type AllOfField,
  type AnyOfField,
  type Field,
  type OneOfField,
} from "@/utils/field";
import {
  mergeAllOfSchemas,
  isAllOfSchema,
  isAnyOfSchema,
  isOneOfSchema,
} from "@/utils/json";
import { FieldShell } from "../FieldShell";
import { JsonFallbackField } from "../JsonFallbackField";
import type { FieldFactory, FieldRenderContext } from "../types";
import { SelectiveCompositionField } from "./SelectiveCompositionField";

export const compositionFieldFactory: FieldFactory = {
  getScore(field) {
    return hasUntypedComposition(field) ? 5 : 0;
  },
  render(ctx) {
    if (isOneOfField(ctx.field)) {
      return renderOptionsField(ctx, ctx.field.oneOf);
    }
    if (isAnyOfField(ctx.field)) {
      return renderOptionsField(ctx, ctx.field.anyOf);
    }
    if (isAllOfField(ctx.field)) {
      return renderAllOfField(ctx);
    }
    throw new Error(`Unsupported composition field '${ctx.field.name}'.`);
  },
};

function hasUntypedComposition(field: Field): boolean {
  return (
    field.schema.type === undefined &&
    (isOneOfField(field) || isAnyOfField(field) || isAllOfField(field))
  );
}

function renderOptionsField(ctx: FieldRenderContext, options: Field[]) {
  if (options.length === 0) {
    return (
      <JsonFallbackField
        field={ctx.field}
        value={ctx.value}
        onChange={ctx.onChange}
        hideLabel={ctx.hideLabel}
      />
    );
  }

  if (options.length === 1) {
    return ctx.generator.renderField(options[0]!, ctx.value, ctx.onChange, {
      hideLabel: ctx.hideLabel,
      hideAdvanced: ctx.hideAdvanced,
      path: ctx.path,
    });
  }

  return <SelectiveCompositionField ctx={ctx} options={options} />;
}

function renderAllOfField(ctx: FieldRenderContext) {
  const field = ctx.field as AllOfField;
  if (field.allOf.length === 0) {
    return (
      <JsonFallbackField
        field={field}
        value={ctx.value}
        onChange={ctx.onChange}
        hideLabel={ctx.hideLabel}
      />
    );
  }

  if (field.allOf.length === 1) {
    return ctx.generator.renderField(field.allOf[0]!, ctx.value, ctx.onChange, {
      hideLabel: ctx.hideLabel,
      hideAdvanced: ctx.hideAdvanced,
      path: ctx.path,
    });
  }

  const mergedField = getFieldFromSchema(
    field.name,
    mergeAllOfSchemas(field.allOf.map((part) => part.schema)),
  );

  return (
    <FieldShell field={field} hideLabel={ctx.hideLabel}>
      {ctx.generator.renderField(mergedField, ctx.value, ctx.onChange, {
        hideLabel: true,
        hideAdvanced: ctx.hideAdvanced,
        path: ctx.path,
      })}
    </FieldShell>
  );
}

function isOneOfField(field: Field): field is OneOfField {
  return isOneOfSchema(field.schema) && "oneOf" in field;
}

function isAnyOfField(field: Field): field is AnyOfField {
  return isAnyOfSchema(field.schema) && "anyOf" in field;
}

function isAllOfField(field: Field): field is AllOfField {
  return isAllOfSchema(field.schema) && "allOf" in field;
}
