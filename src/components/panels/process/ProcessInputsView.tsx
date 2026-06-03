import { useMemo } from "react";
import { Table } from "@mantine/core";

import type { ProcessDescription } from "@/service";
import type { JsonValue } from "@/utils/json";
import { getFieldFromProcessDescriptionInputs } from "@/utils/field";
import type { ProcessInputs } from "@/state/types";
import InputLabel from "./InputLabel";
import InputField from "./InputField";
import { UnavailableHint } from "@/components/common/UnavailableHint";
import { isEmptyObject } from "@/utils/common";

interface ProcessInputsViewProps {
  processDescription: ProcessDescription;
  processInputs: ProcessInputs;
  setProcessInput: (name: string, value: JsonValue) => void;
}

export default function ProcessInputsView({
  processDescription,
  processInputs,
  setProcessInput,
}: ProcessInputsViewProps) {
  const objectField = useMemo(
    () => getFieldFromProcessDescriptionInputs(processDescription),
    [processDescription],
  );
  if (isEmptyObject(processInputs)) {
    return <UnavailableHint message="No inputs available." />;
  }
  return (
    <Table variant="vertical" layout="fixed" withTableBorder>
      <Table.Tbody>
        {Object.keys(objectField.properties)
          .map((inputName) => ({
            name: inputName,
            description: (processDescription.inputs || {})[inputName]!,
            field: objectField.properties[inputName]!,
            value: processInputs[inputName]!,
          }))
          .map(({ name, description, field, value }) => (
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
          ))}
      </Table.Tbody>
    </Table>
  );
}
