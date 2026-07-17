import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { JsonInput, Typography } from "@mantine/core";
import ReactMarkdown from "react-markdown";

import type { Field } from "@/utils/field";
import {
  SchemaValidationError,
  validateJsonValue,
  type JsonValue,
} from "@/utils/json";
import { FieldShell } from "./FieldShell";
import { getFieldValue } from "./fieldUtils";
import type { FieldValue } from "./types";

interface JsonFallbackFieldProps {
  field: Field;
  value: FieldValue;
  onChange: (value: JsonValue) => void;
  hideLabel?: boolean;
  disabled?: boolean;
}

export function JsonFallbackField({
  field,
  value,
  onChange,
  hideLabel,
  disabled,
}: JsonFallbackFieldProps) {
  const initialValue = getFieldValue(field, value);
  const [{ textValue, errorText }, setDraft] = useJsonInputDraft(initialValue);

  const handleChange = useCallback(
    (nextTextValue: string) => {
      let nextErrorText: string | undefined;
      try {
        const nextValue = JSON.parse(nextTextValue) as JsonValue;
        validateJsonValue(field.name, nextValue, field.schema);
        onChange(nextValue);
      } catch (error) {
        if (error instanceof SchemaValidationError) {
          nextErrorText = error.toString();
        } else {
          nextErrorText = "Invalid JSON";
        }
      }
      setDraft({
        textValue: nextTextValue,
        errorText: nextErrorText,
      });
    },
    [field.name, field.schema, onChange, setDraft],
  );

  return (
    <FieldShell field={field} hideLabel={hideLabel}>
      <JsonInput
        value={textValue}
        onChange={handleChange}
        formatOnBlur
        autosize
        minRows={1}
        maxRows={10}
        disabled={disabled}
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
    </FieldShell>
  );
}

function serializeValue(value: JsonValue): string {
  return JSON.stringify(value, null, 2) ?? "";
}

function useJsonInputDraft(value: JsonValue) {
  const serializedValue = serializeValue(value);
  const lastSerializedValue = useRef(serializedValue);
  const [draft, setDraft] = useState(() => ({
    textValue: serializedValue,
    errorText: undefined as string | undefined,
  }));

  useEffect(() => {
    if (lastSerializedValue.current === serializedValue) {
      return;
    }

    lastSerializedValue.current = serializedValue;
    startTransition(() => {
      setDraft({
        textValue: serializedValue,
        errorText: undefined,
      });
    });
  }, [serializedValue]);

  return [draft, setDraft] as const;
}
