import { useEffect, useState, type SubmitEvent } from "react";
import {
  Button,
  Group,
  Modal,
  PasswordInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { IconNetwork } from "@tabler/icons-react";

import type { AppServiceConfig } from "@/config/bootstrap";
import { closeDialog, signIn } from "@/store/actions";
import { useDialogOpened, useLoadService } from "@/store/hooks";
import { getErrorMessage, isPopup } from "@/utils/common";

export function ConfiguredLoginDialog({
  config,
}: {
  config: AppServiceConfig;
}) {
  const opened = useDialogOpened("service");
  const { service, error, isLoading, mutate } = useLoadService();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const connected = Boolean(service && !error);
  const credentials =
    config.authType === "login" || config.authType === "basic";
  const secret = config.authType === "token" || config.authType === "api-key";
  const action = config.authType === "none" ? "Connect" : "Log in";
  const loginError =
    submitError ?? (error ? getErrorMessage(error) : undefined);
  // Sen4CAP can return 405 when it rejects credentials.
  const message =
    loginError === "Login request failed (401)." ||
    loginError === "Login request failed (405)."
      ? "Invalid username or password"
      : loginError;

  useEffect(() => {
    if (opened && connected) closeDialog();
  }, [opened, connected]);

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError(undefined);
    const inputs = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await signIn("configured", { ...inputs, ...config });
      if (error) await mutate();
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isPopup()) return "Please return to the main window...";

  return (
    <Modal
      title={
        <Group>
          <IconNetwork size={20} stroke={1} aria-hidden />
          <Text fw={600}>{action}</Text>
        </Group>
      }
      opened={opened && !connected}
      centered
      onClose={() => {
        setSubmitError(undefined);
        closeDialog();
      }}
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          {credentials && (
            <>
              <TextInput
                label="Username"
                name="username"
                autoComplete="username"
                required
              />
              <PasswordInput
                label="Password"
                name="password"
                autoComplete="current-password"
                required
              />
            </>
          )}
          {secret && (
            <PasswordInput
              label={config.authType === "token" ? "Access token" : "API key"}
              name={config.authType === "token" ? "accessToken" : "apiKey"}
              autoComplete="off"
              required
            />
          )}
          {message && (
            <Text c="red" role="alert">
              {message}
            </Text>
          )}
          <Group justify="flex-end">
            <Button type="submit" loading={isSubmitting || isLoading}>
              {action}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
