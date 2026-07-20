import { useMemo, useState } from "react";

import { Box, Stack, Stepper, Text } from "@mantine/core";

import type {
  ServiceOptions,
  ServiceOptionsInput,
  ServiceProvider,
  Service,
} from "@/service";
import { getErrorMessage } from "@/utils/common";

import { ServiceErrorView } from "./ServiceErrorView";
import { ServiceLoadingView } from "./ServiceLoadingView";
import { ServiceProviderList } from "./ServiceProviderList";
import { ServiceProviderOptionsForm } from "./ServiceProviderOptionsForm";
import { ServiceSignedInView } from "./ServiceSignedInView";

export interface ServiceDialogContentProps {
  service: Service | null;
  serviceError: unknown;
  isLoadingService: boolean;
  serviceProviders: ServiceProvider<ServiceOptions>[];
  serviceProviderId: string | null;
  onClose: () => void;
  onReset: () => void;
  onSignIn: (
    providerId: string,
    options: ServiceOptionsInput<ServiceOptions>,
  ) => Promise<void>;
  onSignOut: () => Promise<void>;
}

type ServiceDialogStep = "select" | "configure" | "connect" | "ready";

const stepIndex: Record<ServiceDialogStep, number> = {
  select: 0,
  configure: 1,
  connect: 2,
  ready: 3,
};

export function ServiceDialogContent({
  service,
  serviceError,
  isLoadingService,
  serviceProviders,
  serviceProviderId,
  onClose,
  onReset,
  onSignIn,
  onSignOut,
}: ServiceDialogContentProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null,
  );
  const [isSigningIn, setIsSigningIn] = useState(false);

  const selectedProvider = useMemo(
    () =>
      serviceProviders.find((provider) => provider.id === selectedProviderId) ??
      null,
    [selectedProviderId, serviceProviders],
  );

  const storedProvider = useMemo(
    () =>
      serviceProviders.find((provider) => provider.id === serviceProviderId) ??
      null,
    [serviceProviderId, serviceProviders],
  );

  const activeProvider = selectedProvider ?? storedProvider;

  const hasOptions = Boolean(
    activeProvider?.optionsSchema &&
    Object.keys(activeProvider.optionsSchema).length,
  );

  const activeStep: ServiceDialogStep = service
    ? "ready"
    : serviceProviderId || serviceError
      ? "connect"
      : selectedProvider
        ? "configure"
        : "select";

  const isCreatingService = Boolean(serviceProviderId && isLoadingService);
  const isBusy = isSigningIn || isCreatingService;

  return (
    <Stack
      w="min(560px, calc(100vw - 64px))"
      h="min(570px, calc(100vh - 180px))"
      gap="lg"
    >
      <Stepper
        active={stepIndex[activeStep]}
        allowNextStepsSelect={false}
        contentPadding={0}
        iconSize={28}
        keepMounted={false}
        size="xs"
      >
        <Stepper.Step allowStepClick={false} label="Select" />
        <Stepper.Step
          allowStepClick={false}
          label="Configure"
          loading={isSigningIn}
        />
        <Stepper.Step
          allowStepClick={false}
          label="Connect"
          loading={isCreatingService}
        />
        <Stepper.Step allowStepClick={false} label="Ready" />
      </Stepper>

      <Box flex={1} style={{ minHeight: 0, overflow: "auto" }}>
        {serviceError ? (
          <ServiceErrorView
            providerTitle={activeProvider?.meta.title}
            message={getErrorMessage(serviceError)}
            onBack={onReset}
            onChooseAnother={onReset}
          />
        ) : !service && !serviceProviderId && !selectedProvider ? (
          <Stack>
            <Text>Please select a service to continue.</Text>
            <ServiceProviderList
              serviceProviders={serviceProviders}
              onSelect={(providerId) => {
                setSelectedProviderId(providerId);
              }}
            />
          </Stack>
        ) : !service && selectedProvider && !serviceProviderId ? (
          <ServiceProviderOptionsForm
            provider={selectedProvider}
            loading={isBusy}
            onBack={() => setSelectedProviderId(null)}
            onSubmit={async (options) => {
              setIsSigningIn(true);
              try {
                await onSignIn(selectedProvider.id, options);
                setSelectedProviderId(null);
              } finally {
                setIsSigningIn(false);
              }
            }}
          />
        ) : !service && serviceProviderId && !serviceError ? (
          <ServiceLoadingView
            providerTitle={activeProvider?.meta.title}
            hasOptions={hasOptions}
            isLoading={isLoadingService}
          />
        ) : service ? (
          <ServiceSignedInView
            service={service}
            onContinue={onClose}
            onSignOut={onSignOut}
          />
        ) : null}
      </Box>
    </Stack>
  );
}
