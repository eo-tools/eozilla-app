import { isNumberSchema } from "@/utils/json";
import { renderNumericField } from "./numberRenderer";
import type { FieldFactory } from "../types";

export const numberFieldFactory: FieldFactory = {
  getScore(field) {
    return isNumberSchema(field.schema) && !field.schema.nullable ? 10 : 0;
  },
  render: renderNumericField,
};
