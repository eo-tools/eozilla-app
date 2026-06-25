import type { Field } from "@/utils/field";
import type { Input } from "@/service";
import { isStringSchema } from "@/utils/json";
import { InputFieldEditor } from "./InputFieldEditor";
import { DateInputFieldEditor } from "./DateInputFieldEditor";
import { MapInputFieldEditor } from "./MapInputFieldEditor";
import { RadioInputFieldEditor } from "./RadioInputFieldEditor";

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
    Array.isArray(inputField.schema.enum) &&
    inputField.schema.enum.every((value) => typeof value === "string") &&
    inputField.widget === "radio"
  ) {
    return (
      <RadioInputFieldEditor
        inputName={inputName}
        inputSchema={inputField.schema}
        inputValue={inputValue}
        setInputValue={setInputValue}
      />
    );
  }

  if (
    isStringSchema(inputField.schema) &&
    inputField.schema.format === "date"
  ) {
    return (
      <DateInputFieldEditor
        inputName={inputName}
        inputSchema={inputField.schema}
        inputValue={inputValue}
        setInputValue={setInputValue}
      />
    );
  }

  if (inputField.widget === "map") {
    return (
      <MapInputFieldEditor
        inputName={inputName}
        inputSchema={inputField.schema}
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
