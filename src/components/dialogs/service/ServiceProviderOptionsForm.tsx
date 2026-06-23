import { useMemo, useState, type SubmitEvent } from "react";

import {
  Box,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";

import type {
  ServiceOptionSchema,
  ServiceOptions,
  ServiceOptionsInput,
  ServiceProvider,
} from "@/service";
import { ResetOnKey } from "@/components/common/ResetOnKey";
import { getErrorMessage } from "@/utils/common";

type DraftValue = string | number | boolean | null | undefined;
type DraftOptions = Record<string, DraftValue>;

export interface ServiceProviderOptionsFormProps {
  provider: ServiceProvider<ServiceOptions>;
  loading?: boolean;
  onBack: () => void;
  onSubmit: (options: ServiceOptionsInput<ServiceOptions>) => Promise<void>;
}

function isEmptyDraftValue(value: DraftValue): boolean {
  return value === null || value === undefined || value === "";
}

function getInitialDraftValue(schema: ServiceOptionSchema): DraftValue {
  if (schema.default !== undefined) {
    return schema.default;
  }
  if (schema.type === "boolean") {
    return false;
  }
  if (schema.type === "string") {
    return schema.enum ? null : "";
  }
  return schema.enum ? null : undefined;
}

function createInitialDraft(
  provider: ServiceProvider<ServiceOptions>,
): DraftOptions {
  const draft: DraftOptions = {};
  Object.entries(provider.optionsSchema ?? {}).forEach(([key, schema]) => {
    draft[key] = getInitialDraftValue(schema);
  });
  return draft;
}

function normalizeDraft(
  provider: ServiceProvider<ServiceOptions>,
  draft: DraftOptions,
): ServiceOptionsInput<ServiceOptions> {
  const options: Record<string, string | number | boolean> = {};

  Object.entries(provider.optionsSchema ?? {}).forEach(([key, schema]) => {
    const value = draft[key];

    if (schema.type === "boolean") {
      options[key] = Boolean(value);
      return;
    }

    if (schema.type === "string") {
      const stringValue = isEmptyDraftValue(value) ? "" : String(value);
      if (!stringValue) {
        if (schema.default !== undefined) {
          options[key] = schema.default;
          return;
        }
        if (schema.nullable) {
          return;
        }
        throw new Error(`Please provide a value for ${schema.title}.`);
      }
      options[key] = stringValue;
      return;
    }

    const rawValue = isEmptyDraftValue(value) ? undefined : value;
    if (rawValue === undefined) {
      if (schema.default !== undefined) {
        options[key] = schema.default;
        return;
      }
      if (schema.nullable) {
        return;
      }
      throw new Error(`Please provide a value for ${schema.title}.`);
    }

    const numberValue =
      typeof rawValue === "number" ? rawValue : Number(rawValue);
    if (!Number.isFinite(numberValue)) {
      throw new Error(`Please provide a valid value for ${schema.title}.`);
    }

    options[key] =
      schema.type === "integer" ? Math.trunc(numberValue) : numberValue;
  });

  return options;
}

function getOptionInputKind(
  schema: ServiceOptionSchema,
): "boolean" | "select" | "number" | "text" {
  if (schema.type === "boolean") {
    return "boolean";
  }
  if (schema.enum) {
    return "select";
  }
  if (schema.type === "number" || schema.type === "integer") {
    return "number";
  }
  return "text";
}

function OptionField({
  schema,
  value,
  onChange,
}: {
  schema: ServiceOptionSchema;
  value: DraftValue;
  onChange: (value: DraftValue) => void;
}) {
  const description = schema.description ? (
    <Text size="sm" c="dimmed">
      {schema.description}
    </Text>
  ) : null;

  if (schema.type === "boolean") {
    return (
      <Stack gap={4}>
        <Checkbox
          checked={Boolean(value)}
          label={schema.title}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
        {description}
      </Stack>
    );
  }

  const inputKind = getOptionInputKind(schema);

  if (inputKind === "select") {
    const options = schema.enum ?? [];
    return (
      <Stack gap={4}>
        <Select
          clearable={schema.nullable}
          data={options.map((option) => ({
            value: String(option),
            label: String(option),
          }))}
          label={schema.title}
          onChange={(nextValue) => onChange(nextValue)}
          value={isEmptyDraftValue(value) ? null : String(value)}
        />
        {description}
      </Stack>
    );
  }

  if (inputKind === "number") {
    return (
      <Stack gap={4}>
        <NumberInput
          label={schema.title}
          onChange={(nextValue) => onChange(nextValue)}
          step={schema.type === "integer" ? 1 : 0.1}
          value={
            typeof value === "number" || typeof value === "string"
              ? value
              : undefined
          }
        />
        {description}
      </Stack>
    );
  }

  return (
    <Stack gap={4}>
      <TextInput
        label={schema.title}
        onChange={(event) => onChange(event.currentTarget.value)}
        value={typeof value === "string" ? value : ""}
      />
      {description}
    </Stack>
  );
}

function ServiceProviderOptionsFormFields({
  provider,
  loading = false,
  onBack,
  onSubmit,
}: ServiceProviderOptionsFormProps) {
  const initialDraft = useMemo(() => createInitialDraft(provider), [provider]);
  const [draftOptions, setDraftOptions] = useState<DraftOptions>(initialDraft);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(normalizeDraft(provider, draftOptions));
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  const hasOptions = Boolean(
    provider.optionsSchema && Object.keys(provider.optionsSchema).length,
  );

  return (
    <Box component="form" onSubmit={handleSubmit} h="100%">
      <Stack h="100%" justify="space-between" gap="md">
        <Stack gap="md">
          {submitError && <Text c="red">{submitError}</Text>}
          <Text>
            {provider.meta.description ||
              `Configure ${provider.meta.title} before continuing.`}
          </Text>
          {!hasOptions ? (
            <Text c="dimmed">
              No additional options are required for this service.
            </Text>
          ) : (
            <Stack gap="sm">
              {Object.entries(provider.optionsSchema ?? {}).map(
                ([key, schema]) => (
                  <OptionField
                    key={key}
                    schema={schema}
                    value={draftOptions[key]}
                    onChange={(nextValue) =>
                      setDraftOptions((currentDraft) => ({
                        ...currentDraft,
                        [key]: nextValue,
                      }))
                    }
                  />
                ),
              )}
            </Stack>
          )}
        </Stack>

        <Group justify="flex-end">
          <Button onClick={onBack} variant="default" type="button">
            Back
          </Button>
          <Button loading={loading || isSubmitting} type="submit">
            Next
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}

export function ServiceProviderOptionsForm(
  props: ServiceProviderOptionsFormProps,
) {
  return (
    <ResetOnKey resetKey={props.provider.id}>
      <ServiceProviderOptionsFormFields {...props} />
    </ResetOnKey>
  );
}
