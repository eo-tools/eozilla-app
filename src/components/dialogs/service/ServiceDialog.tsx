import { useEffect, useRef } from "react";

import { Center, Group, Modal, Text } from "@mantine/core";
import { IconNetwork } from "@tabler/icons-react";

import { closeDialog, resetState, signIn, signOut } from "@/store/actions";
import {
  useDialogOpened,
  useLoadService,
  useServiceProviderId,
  useServiceProviders,
} from "@/store/hooks";
import { isPopup } from "@/utils/common";
import { ServiceDialogContent } from "./ServiceDialogContent";
import type { SerializedServiceProvider } from "@/config/bootstrap";
import { canAutoConnect } from "./FixedServiceLogin";

export function ServiceDialog({
  initialService,
}: {
  initialService?: SerializedServiceProvider | null;
}) {
  const serviceProviders = useServiceProviders();
  const serviceProviderId = useServiceProviderId();
  const {
    service,
    error: serviceError,
    isLoading: isLoadingService,
  } = useLoadService();
  const dialogOpened = useDialogOpened("service");
  const autoConnectStarted = useRef(false);

  useEffect(() => {
    if (
      !initialService ||
      serviceProviderId ||
      serviceError ||
      autoConnectStarted.current ||
      !canAutoConnect(initialService.options)
    ) {
      return;
    }
    autoConnectStarted.current = true;
    void signIn(initialService.id, initialService.options).catch(
      (error: unknown) => {
        console.error("Automatic service sign-in failed.", error);
      },
    );
  }, [initialService, serviceError, serviceProviderId]);

  useEffect(() => {
    if (initialService && service && !serviceError) {
      closeDialog();
    }
  }, [initialService, service, serviceError]);

  if (isPopup()) {
    return "Please return to the main window...";
  }

  const title =
    service && !serviceError
      ? "Service Connected"
      : initialService && !serviceProviderId
        ? "Login"
        : serviceProviderId || initialService
          ? "Configure Service"
          : "Select Service";

  return (
    <Modal
      opened={
        dialogOpened &&
        !(
          initialService &&
          !serviceError &&
          !serviceProviderId &&
          canAutoConnect(initialService.options)
        )
      }
      onClose={closeDialog}
      size={680}
      centered
      title={
        <Group>
          <IconNetwork size={20} stroke={1} />
          <Text fw={600}>{title}</Text>
        </Group>
      }
    >
      <Center h="100%">
        <ServiceDialogContent
          key={`${dialogOpened}-${service?.providerId ?? "none"}-${serviceError ? "error" : "ok"}-${serviceProviderId ?? "none"}`}
          service={service}
          serviceError={serviceError}
          isLoadingService={isLoadingService}
          serviceProviders={serviceProviders}
          serviceProviderId={serviceProviderId}
          onClose={closeDialog}
          onReset={resetState}
          onSignIn={signIn}
          onSignOut={signOut}
          initialOptions={initialService?.options}
          fixedService={Boolean(initialService)}
        />
      </Center>
    </Modal>
  );
}
