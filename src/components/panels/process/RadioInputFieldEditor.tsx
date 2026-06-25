import {
  ActionIcon,
  Group,
  Radio,
  Stack,
  Typography,
} from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

import type { Input } from "@/service";
import {
  SchemaValidationError,
  type StringSchema,
  validateJsonValue,
} from "@/utils/json";

export interface RadioInputFieldEditorProps {
  inputName: string;
  inputSchema: StringSchema;
  inputValue: Input;
  setInputValue: (name: string, value: Input) => void;
}

export function RadioInputFieldEditor({
  inputName,
  inputSchema,
  inputValue,
  setInputValue,
}: RadioInputFieldEditorProps) {
  const options = ((inputSchema.enum ?? []) as unknown[])
    .filter((value): value is string => typeof value === "string")
    .map((value) => ({
      value,
      label: value,
    }));

  const value = typeof inputValue === "string" ? inputValue : null;
  const errorText = getInputErrorText(inputName, inputSchema, inputValue);

  return (
    <Stack gap="xs">
      <Group align="flex-start" justify="space-between">
        <Radio.Group
          value={value ?? ""}
          onChange={(nextValue) => {
            setInputValue(inputName, nextValue);
          }}
        >
          <Stack gap="xs">
            {options.map((option) => (
              <Radio
                key={option.value}
                value={option.value}
                label={option.label}
              />
            ))}
          </Stack>
        </Radio.Group>

        {(inputSchema.nullable ?? false) && value && (
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Clear selection"
            onClick={() => setInputValue(inputName, null)}
          >
            <IconX size={16} />
          </ActionIcon>
        )}
      </Group>

      {errorText && (
        <Typography
          style={{
            fontSize: "var(--mantine-font-size-xs)",
            color: "var(--mantine-color-red)",
          }}
        >
          <ReactMarkdown>{errorText}</ReactMarkdown>
        </Typography>
      )}
    </Stack>
  );
}

function getInputErrorText(
  inputName: string,
  inputSchema: StringSchema,
  inputValue: Input,
): string | undefined {
  try {
    validateJsonValue(inputName, inputValue, inputSchema);
  } catch (error) {
    if (error instanceof SchemaValidationError) {
      return error.toString();
    }
    console.error(error);
    throw error;
  }

  return undefined;
}
