import { useMemo } from "react";
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
  const visibleFields = useMemo(
    () => getVisibleInputFields(inputsField, { hideAdvanced }),
    [inputsField, hideAdvanced],
  );

  if (visibleFields.length === 0) {
    return <UnavailableHint message="No inputs available." />;
  }
  return (
    <Table variant="vertical" layout="fixed" withTableBorder>
      <Table.Tbody>
        {visibleFields.map((field) => (
          <Table.Tr
            key={field.name}
            className={
              !hideAdvanced && field.advanced ? "input-row-appear" : undefined
            }
          >
            <Table.Th w={200}>
              <InputLabel
                inputName={field.name}
                inputDescription={
                  (processDescription.inputs || {})[field.name]!
                }
              />
            </Table.Th>
            <Table.Td>
              <InputField
                inputName={field.name}
                inputField={field}
                inputValue={processInputs[field.name]!}
                setInputValue={setProcessInput}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
