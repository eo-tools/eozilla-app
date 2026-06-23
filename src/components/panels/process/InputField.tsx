import { ResetOnKey } from "@/components/common/ResetOnKey";
import type { Field } from "@/utils/field";
import type { Input } from "@/service";
import { InputFieldEditor } from "./InputFieldEditor";

export interface InputFieldProps {
  inputName: string;
  inputField: Field;
  inputValue: Input;
  setInputValue: (name: string, value: Input) => void;
}

export default function InputField({
  inputName,
  inputField,
  inputValue,
  setInputValue,
}: InputFieldProps) {
  const serializedInputValue = serializeInputValue(inputValue);

  return (
    <ResetOnKey resetKey={serializedInputValue}>
      <InputFieldEditor
        inputName={inputName}
        inputSchema={inputField.schema}
        inputValue={inputValue}
        initialTextValue={serializedInputValue}
        setInputValue={setInputValue}
      />
    </ResetOnKey>
  );
}

function serializeInputValue(inputValue: Input): string {
  return JSON.stringify(inputValue, null, 2) ?? "";
}
