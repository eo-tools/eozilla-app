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

export function ServiceDialog() {
  const serviceProviders = useServiceProviders();
  const serviceProviderId = useServiceProviderId();
  const {
    service,
    error: serviceError,
    isLoading: isLoadingService,
  } = useLoadService();
  const dialogOpened = useDialogOpened("service");

  if (isPopup()) {
    return "Please return to the main window...";
  }

  const title =
    service && !serviceError
      ? "Service Connected"
      : serviceProviderId
        ? "Configure Service"
        : "Select Service";

  return (
    <Modal
      opened={dialogOpened}
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
        />
      </Center>
    </Modal>
  );
}
