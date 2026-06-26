import { useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Popover,
  Stack,
  Typography,
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { IconCalendar, IconX } from "@tabler/icons-react";
import ReactMarkdown from "react-markdown";

import type { Input } from "@/service";
import {
  SchemaValidationError,
  type StringSchema,
  validateJsonValue,
} from "@/utils/json";

export interface DateInputFieldEditorProps {
  inputName: string;
  inputSchema: StringSchema;
  inputValue: Input;
  setInputValue: (name: string, value: Input) => void;
}

export function DateInputFieldEditor({
  inputName,
  inputSchema,
  inputValue,
  setInputValue,
}: DateInputFieldEditorProps) {
  const [opened, setOpened] = useState(false);
  const value = toPickerValue(inputValue);
  const errorText = getInputErrorText(inputName, inputSchema, inputValue);

  const handleChange = (nextValue: string | null) => {
    const nextInputValue = nextValue ?? "";
    const nextErrorText = getInputErrorText(inputName, inputSchema, nextInputValue);

    if (!nextErrorText && inputValue !== nextInputValue) {
      setInputValue(inputName, nextInputValue);
    }

    if (nextValue) {
      setOpened(false);
    }
  };

  return (
    <Stack gap={4} align="flex-start">
      <Group gap="xs">
        <Popover
          opened={opened}
          onChange={setOpened}
          position="bottom-start"
          withArrow
          shadow="md"
        >
          <Popover.Target>
            <Button
              variant="default"
              leftSection={<IconCalendar size={16} />}
              onClick={() => setOpened((current) => !current)}
            >
              {formatDisplayValue(value)}
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <DatePicker value={value} onChange={handleChange} />
          </Popover.Dropdown>
        </Popover>

        {value && (
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Clear date"
            onClick={() => handleChange(null)}
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

function formatDisplayValue(value: string | null) {
  return value || "Select date";
}

function toPickerValue(value: Input): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  return value;
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

  if (
    typeof inputValue === "string" &&
    inputValue.length > 0 &&
    Number.isNaN(new Date(`${inputValue}T00:00:00`).getTime())
  ) {
    return `${inputName} must be a valid date.`;
  }

  return undefined;
}
