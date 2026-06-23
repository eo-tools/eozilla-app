import { JsonInput, Typography } from "@mantine/core";
import ReactMarkdown from "react-markdown";

import type { Input } from "@/service";
import type { Field } from "@/utils/field";
import { useInputFieldController } from "./useInputFieldController";

export interface InputFieldEditorProps {
  inputName: string;
  inputSchema: Field["schema"];
  inputValue: Input;
  setInputValue: (name: string, value: Input) => void;
}

export function InputFieldEditor({
  inputName,
  inputSchema,
  inputValue,
  setInputValue,
}: InputFieldEditorProps) {
  const { textValue, errorText, handleChange } = useInputFieldController({
    inputName,
    inputSchema,
    inputValue,
    setInputValue,
  });

  return (
    <JsonInput
      value={textValue}
      onChange={handleChange}
      formatOnBlur
      autosize
      minRows={1}
      maxRows={10}
      error={
        errorText && (
          <Typography
            style={{
              fontSize: "var(--mantine-font-size-xs)",
              color: "var(--mantine-color-red)",
            }}
          >
            <ReactMarkdown>{errorText}</ReactMarkdown>
          </Typography>
        )
      }
    />
  );
}
