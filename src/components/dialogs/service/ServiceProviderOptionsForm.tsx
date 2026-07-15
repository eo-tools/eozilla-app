import { useMemo, useState, type SubmitEvent } from "react";

import {
  Alert,
  Box,
  Button,
  Code,
  Collapse,
  Divider,
  Group,
  Paper,
  PasswordInput,
  SegmentedControl,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconAdjustments,
  IconInfoCircle,
  IconKey,
  IconLogin2,
  IconPlugConnected,
  IconShieldLock,
  IconWorld,
} from "@tabler/icons-react";

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

function isUrlAuthProvider(provider: ServiceProvider<ServiceOptions>): boolean {
  const properties = provider.optionsSchema;
  const authType = properties?.authType;
  return Boolean(
    properties?.apiUrl &&
    authType?.type === "string" &&
    authType.enum?.includes("oidc"),
  );
}

function normalizeUrlAuthDraft(
  draft: DraftOptions,
): ServiceOptionsInput<ServiceOptions> {
  const apiUrl = requireUrl(draft.apiUrl, "service API URL");
  const authType = String(draft.authType || "none");
  if (authType !== "none" && authType !== "token" && authType !== "oidc") {
    throw new Error("Please select an authentication method.");
  }

  const options: ServiceOptionsInput<ServiceOptions> = { apiUrl, authType };
  if (authType === "token") {
    const token = String(draft.token || "").trim();
    if (!token) {
      throw new Error("Please provide an access token.");
    }
    const useBearer = draft.useBearer !== false;
    options.token = token;
    options.useBearer = useBearer;
    if (!useBearer) {
      options.tokenHeader = String(draft.tokenHeader || "X-Auth-Token").trim();
    }
  }

  if (authType === "oidc") {
    options.issuerUrl = requireUrl(draft.issuerUrl, "OIDC issuer URL");
    const clientId = String(draft.clientId || "").trim();
    if (!clientId) {
      throw new Error("Please provide an OIDC client ID.");
    }
    options.clientId = clientId;
    options.scopes = String(draft.scopes || "openid profile email").trim();
    const audience = String(draft.audience || "").trim();
    if (audience) {
      options.audience = audience;
    }
  }

  return options;
}

function requireUrl(value: DraftValue, label: string): string {
  const url = String(value || "").trim();
  if (!url) {
    throw new Error(`Please provide the ${label}.`);
  }
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error(`Please provide a valid HTTP(S) ${label}.`);
  }
  return url;
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
  const urlAuthProvider = isUrlAuthProvider(provider);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(
        urlAuthProvider
          ? normalizeUrlAuthDraft(draftOptions)
          : normalizeDraft(provider, draftOptions),
      );
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
    <Box
      component="form"
      onSubmit={handleSubmit}
      h="100%"
      style={{ overflow: "hidden" }}
    >
      <Stack h="100%" gap="md">
        <Stack
          gap="md"
          flex={1}
          pr="xs"
          style={{ minHeight: 0, overflowY: "auto" }}
        >
          {submitError && (
            <Alert color="red" icon={<IconInfoCircle size={18} />}>
              {submitError}
            </Alert>
          )}
          <Stack gap={2}>
            <Text fw={600}>Connect to {provider.meta.title}</Text>
            <Text size="sm" c="dimmed">
              {provider.meta.description ||
                "Enter the service address and choose how requests should be authenticated."}
            </Text>
          </Stack>
          {!hasOptions ? (
            <Text c="dimmed">
              No additional options are required for this service.
            </Text>
          ) : urlAuthProvider ? (
            <UrlAuthOptionsFields
              draft={draftOptions}
              onChange={(key, value) =>
                setDraftOptions((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
            />
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
          <Button
            loading={loading || isSubmitting}
            type="submit"
            leftSection={
              draftOptions.authType === "oidc" ? (
                <IconLogin2 size={17} />
              ) : (
                <IconPlugConnected size={17} />
              )
            }
          >
            {draftOptions.authType === "oidc"
              ? "Continue to sign in"
              : "Connect"}
          </Button>
        </Group>
      </Stack>
    </Box>
  );
}

interface UrlAuthOptionsFieldsProps {
  draft: DraftOptions;
  onChange: (key: string, value: DraftValue) => void;
}

function UrlAuthOptionsFields({ draft, onChange }: UrlAuthOptionsFieldsProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const authType = String(draft.authType || "none");
  const useBearer = draft.useBearer !== false;
  const redirectUri = `${window.location.origin}${window.location.pathname}`;

  return (
    <Stack gap="md">
      <TextInput
        required
        type="url"
        label="Service API URL"
        description="Address of the OGC API - Processes service."
        placeholder="https://processes.example.org/"
        leftSection={<IconWorld size={17} />}
        value={String(draft.apiUrl || "")}
        onChange={(event) => onChange("apiUrl", event.currentTarget.value)}
      />

      <Divider />

      <Stack gap="xs">
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            Authentication
          </Text>
          <Text size="xs" c="dimmed">
            Choose what the API expects on each request.
          </Text>
        </Stack>
        <SegmentedControl
          fullWidth
          value={authType}
          data={[
            { label: "Public", value: "none" },
            { label: "Access token", value: "token" },
            { label: "OIDC sign-in", value: "oidc" },
          ]}
          onChange={(value) => onChange("authType", value)}
        />
      </Stack>

      {authType === "none" && (
        <Alert color="gray" icon={<IconInfoCircle size={18} />}>
          Connect directly. No credentials will be sent to the service.
        </Alert>
      )}

      {authType === "token" && (
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <PasswordInput
              required
              label="Access token"
              description="The token is sent with every API request."
              placeholder="Paste access token"
              leftSection={<IconKey size={17} />}
              value={String(draft.token || "")}
              onChange={(event) => onChange("token", event.currentTarget.value)}
            />
            <Switch
              label="Send as a Bearer token"
              description="Uses the standard Authorization header."
              checked={useBearer}
              onChange={(event) =>
                onChange("useBearer", event.currentTarget.checked)
              }
            />
            {!useBearer && (
              <TextInput
                label="Header name"
                placeholder="X-Auth-Token"
                value={String(draft.tokenHeader || "")}
                onChange={(event) =>
                  onChange("tokenHeader", event.currentTarget.value)
                }
              />
            )}
          </Stack>
        </Paper>
      )}

      {authType === "oidc" && (
        <Paper withBorder radius="md" p="md">
          <Stack gap="md">
            <Alert color="blue" icon={<IconShieldLock size={18} />}>
              You’ll sign in at your identity provider and return here. Eozilla
              never asks for your password or a client secret.
            </Alert>
            <TextInput
              required
              type="url"
              label="Issuer URL"
              description="Base URL advertised by your OIDC provider."
              placeholder="https://identity.example.org/realms/my-project"
              value={String(draft.issuerUrl || "")}
              onChange={(event) =>
                onChange("issuerUrl", event.currentTarget.value)
              }
            />
            <TextInput
              required
              label="Client ID"
              description="Public browser client registered for this Eozilla deployment."
              placeholder="eozilla-app"
              value={String(draft.clientId || "")}
              onChange={(event) =>
                onChange("clientId", event.currentTarget.value)
              }
            />
            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                Registered redirect URI
              </Text>
              <Code block>{redirectUri}</Code>
            </Stack>

            <Button
              type="button"
              variant="subtle"
              color="gray"
              size="compact-sm"
              px={0}
              w="fit-content"
              leftSection={<IconAdjustments size={16} />}
              onClick={() => setAdvancedOpen((open) => !open)}
            >
              {advancedOpen ? "Hide advanced options" : "Advanced options"}
            </Button>
            <Collapse expanded={advancedOpen}>
              <Stack gap="md">
                <TextInput
                  label="Scopes"
                  description="Space-separated permissions requested during sign-in."
                  value={String(draft.scopes || "")}
                  onChange={(event) =>
                    onChange("scopes", event.currentTarget.value)
                  }
                />
                <TextInput
                  label="Audience"
                  description="Optional API identifier required by some providers."
                  placeholder="https://api.example.org"
                  value={String(draft.audience || "")}
                  onChange={(event) =>
                    onChange("audience", event.currentTarget.value)
                  }
                />
              </Stack>
            </Collapse>
          </Stack>
        </Paper>
      )}
    </Stack>
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
