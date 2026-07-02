import { isBooleanSchema, isNumericSchema, isStringSchema } from "@/utils/json";
import { isPrimitiveField } from "../fieldUtils";
import { renderBooleanField } from "./booleanRenderer";
import { renderNumericField } from "./numberRenderer";
import { renderStringField } from "./stringRenderer";
import type { FieldFactory } from "../types";

export const primitiveFieldFactory: FieldFactory = {
  getScore(field) {
    return isPrimitiveField(field) && !field.schema.nullable ? 10 : 0;
  },
  render(ctx) {
    const schema = ctx.field.schema;
    if (isBooleanSchema(schema)) {
      return renderBooleanField(ctx);
    }
    if (isNumericSchema(schema)) {
      return renderNumericField(ctx);
    }
    if (isStringSchema(schema)) {
      return renderStringField(ctx);
    }
    throw new Error(`Unsupported primitive field '${ctx.field.name}'.`);
  },
};
