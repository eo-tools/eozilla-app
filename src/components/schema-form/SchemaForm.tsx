import { useMemo } from "react";

import type { Field } from "@/utils/field";
import type { JsonValue } from "@/utils/json";
import { createDefaultFieldFactoryRegistry } from "./factories/defaultRegistry";
import {
  DefaultSchemaFormGenerator,
  type FieldFactoryRegistry,
} from "./generator";
import type { FieldRenderOptions, FieldValue } from "./types";

interface SchemaFormProps extends FieldRenderOptions {
  field: Field;
  value: FieldValue;
  onChange: (value: JsonValue) => void;
  registry?: FieldFactoryRegistry;
}

export function SchemaForm({
  field,
  value,
  onChange,
  registry,
  labelHidden,
  hideAdvanced,
}: SchemaFormProps) {
  const generator = useMemo(
    () =>
      new DefaultSchemaFormGenerator(
        registry ?? createDefaultFieldFactoryRegistry(),
      ),
    [registry],
  );

  return generator.renderField(field, value, onChange, {
    labelHidden,
    hideAdvanced,
  });
}
