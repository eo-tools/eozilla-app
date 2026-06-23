import { useCallback, useEffect, useRef, useState } from "react";

import type { Input } from "@/service";
import type { Field } from "@/utils/field";
import { SchemaValidationError, validateJsonValue } from "@/utils/json";

export interface InputFieldControllerArgs {
  inputName: string;
  inputSchema: Field["schema"];
  inputValue: Input;
  setInputValue: (name: string, value: Input) => void;
}

export function useInputFieldController({
  inputName,
  inputSchema,
  inputValue,
  setInputValue,
}: InputFieldControllerArgs) {
  const [{ textValue, errorText }, setDraft] = useJsonInputDraft(inputValue);
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

function serializeInputValue(inputValue: Input): string {
  return JSON.stringify(inputValue, null, 2) ?? "";
}

function useJsonInputDraft(inputValue: Input) {
  const serializedInputValue = serializeInputValue(inputValue);
  const lastSerializedInputValue = useRef(serializedInputValue);
  const [draft, setDraft] = useState(() => ({
    textValue: serializedInputValue,
    errorText: undefined as string | undefined,
  }));

  useEffect(() => {
    if (lastSerializedInputValue.current === serializedInputValue) {
      return;
    }

    lastSerializedInputValue.current = serializedInputValue;
    // External store updates replace the local editor draft without remounting,
    // so the JSON editor keeps focus while the user types valid values.
    setDraft({
      textValue: serializedInputValue,
      errorText: undefined,
    });
  }, [serializedInputValue]);

  return [draft, setDraft] as const;
}
