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
  return (
    <InputFieldEditor
      inputName={inputName}
      inputSchema={inputField.schema}
      inputValue={inputValue}
      setInputValue={setInputValue}
    />
  );
}
