import { isIntegerSchema } from "@/utils/json";
import { renderNumericField } from "./number";
import type { FieldFactory } from "../types";

export const integerFieldFactory: FieldFactory = {
  getScore(field) {
    return isIntegerSchema(field.schema) && !field.schema.nullable ? 10 : 0;
  },
  render: renderNumericField,
};
