import { Stack } from "@mantine/core";

import { UnavailableHint } from "@/components/common/UnavailableHint";
import { SchemaForm } from "@/components/schema-form";
import type { Input, ProcessInputs } from "@/service";
import type { ObjectField } from "@/utils/field";
import { isJsonObject, type JsonObject, type JsonValue } from "@/utils/json";
import { getVisibleInputFields } from "@/utils/field";

interface GeneratedProcessInputsViewProps {
  processInputs: ProcessInputs;
  inputsField: ObjectField;
  setProcessInput: (name: string, value: Input) => void;
  hideAdvanced?: boolean;
}

export default function GeneratedProcessInputsView({
  processInputs,
  inputsField,
  setProcessInput,
  hideAdvanced,
}: GeneratedProcessInputsViewProps) {
  const visibleFields = getVisibleInputFields(inputsField, { hideAdvanced });

  if (visibleFields.length === 0) {
    return <UnavailableHint message="No inputs available." />;
  }

  const handleChange = (nextValue: JsonValue) => {
    if (!isJsonObject(nextValue)) {
      return;
    }

    updateChangedInputs(processInputs, nextValue, setProcessInput);
  };

  return (
    <Stack gap="md">
      <SchemaForm
        field={inputsField}
        value={processInputs}
        onChange={handleChange}
        hideLabel
        hideAdvanced={hideAdvanced}
      />
    </Stack>
  );
}

function updateChangedInputs(
  currentInputs: ProcessInputs,
  nextInputs: JsonObject,
  setProcessInput: (name: string, value: Input) => void,
) {
  for (const [name, nextValue] of Object.entries(nextInputs)) {
    if (!areJsonValuesEqual(currentInputs[name], nextValue)) {
      setProcessInput(name, nextValue);
    }
  }
}

function areJsonValuesEqual(a: JsonValue | undefined, b: JsonValue): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
