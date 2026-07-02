import { isBooleanSchema } from "@/utils/json";
import { renderBooleanField } from "./booleanRenderer";
import type { FieldFactory } from "../types";

export const booleanFieldFactory: FieldFactory = {
  getScore(field) {
    return isBooleanSchema(field.schema) && !field.schema.nullable ? 10 : 0;
  },
  render: renderBooleanField,
};
