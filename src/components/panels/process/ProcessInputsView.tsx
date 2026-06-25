import { Table } from "@mantine/core";

import type { Input, ProcessDescription, ProcessInputs } from "@/service";
import { getVisibleInputFields, type ObjectField } from "@/utils/field";
import InputLabel from "./InputLabel";
import InputField from "./InputField";
import { UnavailableHint } from "@/components/common/UnavailableHint";

interface ProcessInputsViewProps {
  processDescription: ProcessDescription;
  processInputs: ProcessInputs;
  inputsField: ObjectField;
  setProcessInput: (name: string, value: Input) => void;
  hideAdvanced?: boolean;
}

export default function ProcessInputsView({
  processDescription,
  processInputs,
  inputsField,
  setProcessInput,
  hideAdvanced,
}: ProcessInputsViewProps) {
  const visibleInputs = getVisibleInputFields(inputsField, {
    hideAdvanced,
  }).map((field) => ({
    name: field.name,
    description: (processDescription.inputs || {})[field.name]!,
    field,
    value: processInputs[field.name]!,
  }));

  if (visibleInputs.length === 0) {
    return <UnavailableHint message="No inputs available." />;
  }
  return (
    <Table variant="vertical" layout="fixed" withTableBorder>
      <Table.Tbody>
        {visibleInputs.map(({ name, description, field, value }) => (
          <Table.Tr
            key={name}
            className={!hideAdvanced && field.advanced ? "input-row-appear" : undefined}
          >
            <Table.Th w={200}>
              <InputLabel inputName={name} inputDescription={description} />
            </Table.Th>
            <Table.Td>
              <InputField
                inputName={name}
                inputField={field}
                inputValue={value}
                setInputValue={setProcessInput}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
