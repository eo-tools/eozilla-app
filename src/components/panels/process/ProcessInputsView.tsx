import { useMemo } from "react";
import { Table } from "@mantine/core";

import type { Input, ProcessDescription, ProcessInputs } from "@/service";
import { getFieldFromProcessDescriptionInputs } from "@/utils/field";
import InputLabel from "./InputLabel";
import InputField from "./InputField";
import { UnavailableHint } from "@/components/common/UnavailableHint";

interface ProcessInputsViewProps {
  processDescription: ProcessDescription;
  processInputs: ProcessInputs;
  setProcessInput: (name: string, value: Input) => void;
  hideAdvanced?: boolean;
}

export default function ProcessInputsView({
  processDescription,
  processInputs,
  setProcessInput,
  hideAdvanced,
}: ProcessInputsViewProps) {
  const objectField = useMemo(
    () => getFieldFromProcessDescriptionInputs(processDescription),
    [processDescription],
  );
  const inputNames = Object.keys(objectField.properties);
  if (inputNames.length === 0) {
    return <UnavailableHint message="No inputs available." />;
  }
  return (
    <Table variant="vertical" layout="fixed" withTableBorder>
      <Table.Tbody>
        {inputNames
          .map((inputName) => ({
            name: inputName,
            description: (processDescription.inputs || {})[inputName]!,
            field: objectField.properties[inputName]!,
            value: processInputs[inputName]!,
          }))
          .map(({ name, description, field, value }) =>
            hideAdvanced && field.advanced ? null : (
              <Table.Tr key={name}>
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
            ),
          )}
      </Table.Tbody>
    </Table>
  );
}
