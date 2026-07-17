import { useMemo } from "react";

import type { Field } from "@/utils/field";
import type { JsonValue } from "@/utils/json";
import { DynamicExpressionProvider } from "@/components/dynamic-expressions";
import { createDefaultFieldFactoryRegistry } from "./factories/defaultRegistry";
import {
  DefaultSchemaFormGenerator,
  type FieldFactoryRegistry,
} from "./generator";
import type { FieldValue } from "./types";

interface SchemaFormProps {
  field: Field;
  value: FieldValue;
  onChange: (value: JsonValue) => void;
  registry?: FieldFactoryRegistry;
  hideLabel?: boolean;
  hideAdvanced?: boolean;
  disabled?: boolean;
}

export function SchemaForm({
  field,
  value,
  onChange,
  registry,
  hideLabel,
  hideAdvanced,
  disabled,
}: SchemaFormProps) {
  const generator = useMemo(
    () =>
      new DefaultSchemaFormGenerator(
        registry ?? createDefaultFieldFactoryRegistry(),
      ),
    [registry],
  );

  const renderedForm = generator.renderField(field, value, onChange, {
    hideLabel,
    hideAdvanced,
    disabled,
    valuePath: [],
  });
  if (!field.hasDynamicExpressions) {
    return renderedForm;
  }
  return (
    <DynamicExpressionProvider value={value}>
      {renderedForm}
    </DynamicExpressionProvider>
  );
}
