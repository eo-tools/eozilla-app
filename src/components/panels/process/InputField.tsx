import { useCallback, useState } from "react";
import { JsonInput, Typography } from "@mantine/core";
import ReactMarkdown from "react-markdown";

import type { Field } from "@/utils/field";
import { SchemaValidationError, validateJsonValue } from "@/utils/json";
import type { Input } from "@/service";

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
  const inputSchema = inputField.schema;
  const [textValue, setTextValue] = useState(() =>
    JSON.stringify(inputValue, null, 2),
  );
  const [errorText, setErrorText] = useState<string>();
  const validateInputValue = useCallback(
    (inputValue: Input) => {
      try {
        validateJsonValue(inputName, inputValue, inputSchema);
      } catch (error) {
        if (error instanceof SchemaValidationError) {
          return error;
        }
        console.error(error);
        throw error;
      }
    },
    [inputName, inputSchema],
  );
  const handleChange = useCallback(
    (textValue_: string) => {
      setTextValue(textValue_);
      try {
        const inputValue_ = JSON.parse(textValue_);
        const error = validateInputValue(inputValue_);
        if (error) {
          setErrorText(error.toString());
        } else {
          setErrorText(undefined);
          if (inputValue !== inputValue_) {
            setInputValue(inputName, inputValue_);
          }
        }
      } catch (_e) {
        setErrorText("Invalid JSON");
      }
    },
    [inputName, inputValue, setInputValue, validateInputValue],
  );
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
