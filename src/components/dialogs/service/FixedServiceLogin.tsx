import { useState, type SubmitEvent } from "react";

import {
  Box,
  Button,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";

import type { ServiceOptions, ServiceOptionsInput } from "@/service";
import { getErrorMessage } from "@/utils/common";

interface FixedServiceLoginProps {
  options: ServiceOptionsInput<ServiceOptions>;
  providerTitle: string;
  loading?: boolean;
  onSubmit: (options: ServiceOptionsInput<ServiceOptions>) => Promise<void>;
}

export function FixedServiceLogin({
  options: initialOptions,
  providerTitle,
  loading = false,
  onSubmit,
}: FixedServiceLoginProps) {
  const [options, setOptions] = useState(initialOptions);

  const authType = options.authType;
  const isOidc = authType === "oauth2" && !options.accessToken;

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onSubmit(options);
    } catch (error) {
      notifications.show({
        message: `Anmeldung fehlgeschlagen: ${getErrorMessage(error)}`,
        color: "red",
      });
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} h="100%">
      <Stack h="100%" justify="space-between">
        <Stack gap="md">
          <Text>
            {isOidc
              ? `Bei ${providerTitle} anmelden.`
              : `Mit ${providerTitle} verbinden.`}
          </Text>
          {authType === "token" && (
            <PasswordInput
              label="Access Token"
              value={stringValue(options.accessToken)}
              onChange={(event) =>
                setOptions({
                  ...options,
                  accessToken: event.currentTarget.value,
                })
              }
              required
              autoFocus
            />
          )}
          {authType === "api-key" && (
            <PasswordInput
              label="API-Key"
              value={stringValue(options.apiKey)}
              onChange={(event) =>
                setOptions({ ...options, apiKey: event.currentTarget.value })
              }
              required
              autoFocus
            />
          )}
          {(authType === "basic" || authType === "login") && (
            <>
              <TextInput
                label="Benutzername"
                value={stringValue(options.username)}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    username: event.currentTarget.value,
                  })
                }
                required
                autoFocus
              />
              <PasswordInput
                label="Passwort"
                value={stringValue(options.password)}
                onChange={(event) =>
                  setOptions({
                    ...options,
                    password: event.currentTarget.value,
                  })
                }
                required
              />
            </>
          )}
        </Stack>
        <Button
          type="submit"
          loading={loading}
          disabled={isOidc ? false : !hasCredentials(options)}
        >
          {isOidc ? "Login" : "Verbinden"}
        </Button>
      </Stack>
    </Box>
  );
}

function stringValue(value: ServiceOptions["accessToken"]): string {
  return typeof value === "string" ? value : "";
}

function hasCredentials(options: ServiceOptionsInput<ServiceOptions>): boolean {
  switch (options.authType) {
    case "token":
      return Boolean(options.accessToken);
    case "api-key":
      return Boolean(options.apiKey);
    case "basic":
    case "login":
      return Boolean(options.username && options.password);
    default:
      return true;
  }
}
