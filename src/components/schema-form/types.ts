import type { ReactElement } from "react";

import type { Field } from "@/utils/field";
import type { JsonValue } from "@/utils/json";

export type FieldValue = JsonValue | undefined;

export interface FieldRenderOptions {
  labelHidden?: boolean;
  hideAdvanced?: boolean;
}

export interface FieldRenderContext extends FieldRenderOptions {
  field: Field;
  path: string[];
  value: FieldValue;
  onChange: (value: JsonValue) => void;
  generator: SchemaFormGenerator;
}

export interface FieldFactory {
  getScore: (field: Field) => number;
  render: (ctx: FieldRenderContext) => ReactElement;
}

export interface SchemaFormGenerator {
  renderField: (
    field: Field,
    value: FieldValue,
    onChange: (value: JsonValue) => void,
    options?: FieldRenderOptions & { path?: string[] },
  ) => ReactElement;
}
