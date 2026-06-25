import type { Field } from "@/utils/field";
import type { Input } from "@/service";
import { isStringSchema } from "@/utils/json";
import { InputFieldEditor } from "./InputFieldEditor";
import { MapInputFieldEditor } from "./MapInputFieldEditor";

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
  if (
    isStringSchema(inputField.schema) &&
    (inputField.widget === "map" || inputField.schema.format === "wkt")
  ) {
    return (
      <MapInputFieldEditor
        inputName={inputName}
        inputValue={inputValue}
        setInputValue={setInputValue}
      />
    );
  }

  return (
    <InputFieldEditor
      inputName={inputName}
      inputSchema={inputField.schema}
      inputValue={inputValue}
      setInputValue={setInputValue}
    />
  );
}
