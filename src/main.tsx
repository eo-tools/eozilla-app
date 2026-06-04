import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Note, order matters!
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

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

  const appConfig = bootstrapConfig.config;
  if (appConfig) {
    providers.push(
      new CustomServiceProvider({
        id: appConfig.serviceProviderId,
        meta: appConfig.serviceProviderMeta,
      }),
    );
    storage.serviceProviderSelection.set({
      providerId: appConfig.serviceProviderId,
      options: appConfig.serviceProviderOptions,
    });
  }

  registerServiceProviders(providers);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <Notifications />
      <App compact={bootstrapConfig.compact} />
    </MantineProvider>
  </StrictMode>,
);
