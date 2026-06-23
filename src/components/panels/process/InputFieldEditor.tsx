import { useCallback, useState } from "react";
import { JsonInput, Typography } from "@mantine/core";
import ReactMarkdown from "react-markdown";

import type { Input } from "@/service";
import type { Field } from "@/utils/field";
import { SchemaValidationError, validateJsonValue } from "@/utils/json";

export interface InputFieldEditorProps {
  inputName: string;
  inputSchema: Field["schema"];
  inputValue: Input;
  initialTextValue: string;
  setInputValue: (name: string, value: Input) => void;
}

export function InputFieldEditor({
  inputName,
  inputSchema,
  inputValue,
  initialTextValue,
  setInputValue,
}: InputFieldEditorProps) {
  const { textValue, errorText, handleChange } = useInputFieldController({
    inputName,
    inputSchema,
    inputValue,
    initialTextValue,
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

function useJsonInputDraft(initialTextValue: string) {
  const [draft, setDraft] = useState(() => ({
    textValue: initialTextValue,
    errorText: undefined as string | undefined,
  }));

  return [draft, setDraft] as const;
}

interface InputFieldControllerArgs {
  inputName: string;
  inputSchema: Field["schema"];
  inputValue: Input;
  initialTextValue: string;
  setInputValue: (name: string, value: Input) => void;
}

function useInputFieldController({
  inputName,
  inputSchema,
  inputValue,
  initialTextValue,
  setInputValue,
}: InputFieldControllerArgs) {
  const [{ textValue, errorText }, setDraft] =
    useJsonInputDraft(initialTextValue);
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
    (nextTextValue: string) => {
      let nextErrorText: string | undefined;
      try {
        const nextInputValue = JSON.parse(nextTextValue);
        const error = validateInputValue(nextInputValue);
        if (error) {
          nextErrorText = error.toString();
        } else if (inputValue !== nextInputValue) {
          setInputValue(inputName, nextInputValue);
        }
      } catch (_e) {
        nextErrorText = "Invalid JSON";
      }
      setDraft({
        textValue: nextTextValue,
        errorText: nextErrorText,
      });
    },
    [inputName, inputValue, setDraft, setInputValue, validateInputValue],
  );

  return {
    textValue,
    errorText,
    handleChange,
  };
}
