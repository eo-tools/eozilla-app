import type { ReactElement } from "react";

import type { Field } from "@/utils/field";
import type { JsonValue } from "@/utils/json";
import type { ValuePath } from "@/components/dynamic-expressions";

export type FieldValue = JsonValue | undefined;

export interface FieldRenderOptions {
  hideLabel?: boolean;
  hideAdvanced?: boolean;
  disabled?: boolean;
  className?: string;
  container?: (element: ReactElement, disabled: boolean) => ReactElement;
  path?: string[];
  valuePath?: ValuePath;
  index?: number;
}

export interface FieldRenderContext extends FieldRenderOptions {
  field: Field;
  path: string[];
  valuePath: ValuePath;
  index?: number;
  value: FieldValue;
  disabled: boolean;
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
    options?: FieldRenderOptions,
  ) => ReactElement;
}
