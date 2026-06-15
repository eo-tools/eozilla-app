import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Note, order matters!
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { RemoteStateProvider } from "remotestate";

import {
  registerServiceProviders,
  type ServiceOptions,
  type ServiceProvider,
} from "@/service";
import { parseAppBootstrapConfig } from "@/config/bootstrap";
import { CustomServiceProvider } from "@/service/providers/custom";
import { DevServiceProvider } from "@/service/providers/dev";
import { TestServiceProvider } from "@/service/providers/test";
import { storage } from "@/state/storage";
import { initAppStore } from "@/store/store";
import App from "@/components/App";

const bootstrapConfig = parseAppBootstrapConfig();

initAppStore(() => {
  const providers: ServiceProvider<ServiceOptions>[] = [
    new CustomServiceProvider(),
    new DevServiceProvider(),
    new TestServiceProvider(),
  ];

  const serviceProvider = bootstrapConfig.service;
  if (serviceProvider) {
    providers.push(
      new CustomServiceProvider({
        id: serviceProvider.id,
        meta: serviceProvider.meta,
      }),
    );
    storage.serviceProviderSelection.set({
      id: serviceProvider.id,
      options: serviceProvider.options,
    });
  }

  registerServiceProviders(providers);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RemoteStateProvider active={!!bootstrapConfig.ws} url={bootstrapConfig.ws}>
      <MantineProvider forceColorScheme={bootstrapConfig.scheme}>
        <Notifications />
        <App compact={bootstrapConfig.compact} />
      </MantineProvider>
    </RemoteStateProvider>
  </StrictMode>,
);
