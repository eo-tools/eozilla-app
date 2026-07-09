import { useMemo, useState, type SubmitEvent } from "react";

import { Box, Button, Group, Stack, Text } from "@mantine/core";

import { SchemaForm } from "@/components/schema-form";
import type {
  ServiceOptionSchema,
  ServiceOptions,
  ServiceOptionsInput,
  ServiceProvider,
} from "@/service";
import { ResetOnKey } from "@/components/common/ResetOnKey";
import { getFieldFromSchema, type ObjectField } from "@/utils/field";
import { getErrorMessage } from "@/utils/common";
import { isJsonObject, type JsonSchema, type JsonValue } from "@/utils/json";

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
  if (schema.nullable) {
    return null;
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

    if (value === null || value === undefined) {
      if (schema.default !== undefined) {
        options[key] = schema.default;
        return;
      }
      if (schema.nullable) {
        return;
      }
    }

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

function getOptionsField(
  provider: ServiceProvider<ServiceOptions>,
): ObjectField | null {
  const properties = provider.optionsSchema;
  if (!properties || Object.keys(properties).length === 0) {
    return null;
  }

  return getFieldFromSchema("root", {
    type: "object",
    properties: properties as Record<string, JsonSchema>,
    additionalProperties: false,
  }) as ObjectField;
}

function ServiceProviderOptionsFormFields({
  provider,
  loading = false,
  onBack,
  onSubmit,
}: ServiceProviderOptionsFormProps) {
  const initialDraft = useMemo(() => createInitialDraft(provider), [provider]);
  const optionsField = useMemo(() => getOptionsField(provider), [provider]);
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
            optionsField && (
              <SchemaForm
                field={optionsField}
                value={draftOptions as unknown as JsonValue}
                onChange={(nextValue) => {
                  if (isJsonObject(nextValue)) {
                    setDraftOptions(nextValue as DraftOptions);
                  }
                }}
                hideLabel
              />
            )
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
