import {
  Fragment,
  startTransition,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActionIcon,
  Alert,
  Button,
  Flex,
  Group,
  Stack,
  TextInput,
} from "@mantine/core";
import {
  IconArrowDown,
  IconArrowUp,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";

import {
  createJsonValueForSchema,
  type JsonArray,
  type JsonValue,
} from "@/utils/json";
import { FieldShell } from "./FieldShell";
import { getFieldValue, isArrayField } from "./fieldUtils";
import type { FieldRenderContext } from "./types";

export type ArrayFieldMode = "input" | "editor";

interface ArrayFieldProps {
  ctx: FieldRenderContext;
  mode: ArrayFieldMode;
  separator: string;
}

export function ArrayField({ ctx, mode, separator }: ArrayFieldProps) {
  if (mode === "input") {
    return <ArrayTextInputField ctx={ctx} separator={separator} />;
  }

  return <ArrayEditorField ctx={ctx} />;
}

function ArrayTextInputField({
  ctx,
  separator,
}: {
  ctx: FieldRenderContext;
  separator: string;
}) {
  const arrayField = ctx.field;
  if (!isArrayField(arrayField)) {
    throw new Error(`Unsupported array field '${ctx.field.name}'.`);
  }

  const value = getArrayValue(ctx);
  const serializedValue = useMemo(
    () => serializeArrayValue(value, separator),
    [separator, value],
  );
  const [{ textValue, errorMessage }, setDraft] =
    useArrayInputDraft(serializedValue);

  return (
    <FieldShell field={ctx.field} hideLabel={ctx.hideLabel}>
      <Stack gap="xs">
        <TextInput
          value={textValue}
          disabled={ctx.disabled}
          onChange={(event) => {
            const nextTextValue = event.currentTarget.value;
            try {
              const nextValue = parseArrayValue(
                nextTextValue,
                arrayField.items.schema,
                separator,
              );
              ctx.onChange(nextValue);
              setDraft({
                textValue: nextTextValue,
                errorMessage: null,
              });
            } catch (error) {
              setDraft({
                textValue: nextTextValue,
                errorMessage:
                  error instanceof Error
                    ? error.message
                    : "Invalid array input.",
              });
            }
          }}
        />
        {errorMessage ? (
          <Alert color="yellow" variant="light" py="xs">
            {errorMessage}
          </Alert>
        ) : null}
      </Stack>
    </FieldShell>
  );
}

function ArrayEditorField({ ctx }: { ctx: FieldRenderContext }) {
  const arrayField = ctx.field;
  if (!isArrayField(arrayField)) {
    throw new Error(`Unsupported array field '${ctx.field.name}'.`);
  }

  const value = getArrayValue(ctx);
  const canAddMore =
    typeof arrayField.schema.maxItems !== "number" ||
    value.length < arrayField.schema.maxItems;

  return (
    <FieldShell field={ctx.field} hideLabel={ctx.hideLabel}>
      <Stack gap="sm">
        {value.map((itemValue, index) => (
          <Fragment key={index}>
            {ctx.generator.renderField(
              arrayField.items,
              itemValue,
              (nextValue) =>
                ctx.onChange(replaceArrayItem(value, index, nextValue)),
              {
                hideAdvanced: ctx.hideAdvanced,
                hideLabel: true,
                path: [...ctx.path, String(index)],
                valuePath: [...ctx.valuePath, index],
                index,
                disabled: ctx.disabled,
                container: (element, disabled) => (
                  <Flex gap="xs" align="flex-start">
                    <Stack gap={4} style={{ flex: 1 }}>
                      {element}
                    </Stack>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon
                        variant="default"
                        aria-label={`Move item ${index + 1} up`}
                        onClick={() =>
                          ctx.onChange(moveArrayItem(value, index, index - 1))
                        }
                        disabled={disabled || index === 0}
                      >
                        <IconArrowUp size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="default"
                        aria-label={`Move item ${index + 1} down`}
                        onClick={() =>
                          ctx.onChange(moveArrayItem(value, index, index + 1))
                        }
                        disabled={disabled || index === value.length - 1}
                      >
                        <IconArrowDown size={14} />
                      </ActionIcon>
                      <ActionIcon
                        variant="default"
                        color="red"
                        aria-label={`Remove item ${index + 1}`}
                        onClick={() =>
                          ctx.onChange(removeArrayItem(value, index))
                        }
                        disabled={
                          disabled ||
                          value.length <= (arrayField.schema.minItems ?? 0)
                        }
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Flex>
                ),
              },
            )}
          </Fragment>
        ))}
        <Button
          variant="default"
          leftSection={<IconPlus size={14} />}
          onClick={() =>
            ctx.onChange([
              ...value,
              createJsonValueForSchema(arrayField.items.schema),
            ])
          }
          disabled={ctx.disabled || !canAddMore}
        >
          Add item
        </Button>
      </Stack>
    </FieldShell>
  );
}

function useArrayInputDraft(serializedValue: string) {
  const lastSerializedValue = useRef(serializedValue);
  const [draft, setDraft] = useState(() => ({
    textValue: serializedValue,
    errorMessage: null as string | null,
  }));

  useEffect(() => {
    if (lastSerializedValue.current === serializedValue) {
      return;
    }

    lastSerializedValue.current = serializedValue;
    startTransition(() => {
      setDraft({
        textValue: serializedValue,
        errorMessage: null,
      });
    });
  }, [serializedValue]);

  return [draft, setDraft] as const;
}

function getArrayValue(ctx: FieldRenderContext): JsonArray {
  const value = getFieldValue(ctx.field, ctx.value);
  return Array.isArray(value) ? value : [];
}

function serializeArrayValue(value: JsonArray, separator: string) {
  return value.map((item) => String(item ?? "")).join(separator);
}

function parseArrayValue(
  textValue: string,
  itemSchema: Parameters<typeof createJsonValueForSchema>[0],
  separator: string,
): JsonArray {
  const normalizedText = textValue.trim();
  if (!normalizedText) {
    return [];
  }

  const parts = splitArrayInput(normalizedText, separator);
  return parts.map((part) => parseArrayItem(part, itemSchema));
}

function splitArrayInput(textValue: string, separator: string) {
  if (separator === ", ") {
    return textValue
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  return textValue
    .split(separator)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseArrayItem(
  textValue: string,
  itemSchema: Parameters<typeof createJsonValueForSchema>[0],
): JsonValue {
  if (itemSchema.type === "boolean") {
    const normalized = textValue.toLowerCase();
    if (normalized === "true") {
      return true;
    }
    if (normalized === "false") {
      return false;
    }
    throw new Error("Boolean arrays expect values separated as true or false.");
  }

  if (itemSchema.type === "number" || itemSchema.type === "integer") {
    const numberValue = Number(textValue);
    if (!Number.isFinite(numberValue)) {
      throw new Error("Numeric arrays expect valid numbers.");
    }
    return itemSchema.type === "integer"
      ? Math.round(numberValue)
      : numberValue;
  }

  if (itemSchema.type === "string") {
    return textValue;
  }

  throw new Error("This array input only supports primitive item types.");
}

function replaceArrayItem(
  value: JsonArray,
  index: number,
  nextValue: JsonValue,
) {
  return value.map((item, itemIndex) =>
    itemIndex === index ? nextValue : item,
  );
}

function removeArrayItem(value: JsonArray, index: number) {
  return value.filter((_, itemIndex) => itemIndex !== index);
}

function moveArrayItem(value: JsonArray, fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= value.length) {
    return value;
  }

  const nextValue = [...value];
  const [item] = nextValue.splice(fromIndex, 1);
  nextValue.splice(toIndex, 0, item);
  return nextValue;
}
