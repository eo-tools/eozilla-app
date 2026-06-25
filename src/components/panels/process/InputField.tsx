import type { Field } from "@/utils/field";
import type { Input } from "@/service";
import { isArraySchema, isStringSchema } from "@/utils/json";
import { InputFieldEditor } from "./InputFieldEditor";
import { BboxInputFieldEditor } from "./BboxInputFieldEditor";
import { WktInputFieldEditor } from "./WktInputFieldEditor";

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
  if (inputField.widget === "map" && isStringSchema(inputField.schema)) {
    return (
      <WktInputFieldEditor
        inputName={inputName}
        inputValue={inputValue}
        setInputValue={setInputValue}
      />
    );
  }

  if (inputField.widget === "map" && isArraySchema(inputField.schema)) {
    return (
      <BboxInputFieldEditor
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
