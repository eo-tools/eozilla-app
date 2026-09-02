import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Note, order matters!
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
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
import { configureLocalUrlProxy } from "@/config/localUrlProxy";
import { CustomServiceProvider } from "@/service/providers/custom";
import { DevServiceProvider } from "@/service/providers/dev";
import { TestingServiceProvider } from "@/service/providers/testing";
import { initAppStore } from "@/store/store";
import App from "@/components/App";
import {
  createFallbackAppRemoteStateClient,
  type ProcessRequestsService,
} from "@/store/remotestate";

const bootstrapConfig = parseAppBootstrapConfig();
configureLocalUrlProxy(bootstrapConfig.proxy);
console.debug("bootstrapConfig:", bootstrapConfig);
const serviceProvider = bootstrapConfig.service;

initAppStore(() => {
  const providers: ServiceProvider<ServiceOptions>[] = serviceProvider
    ? [
        new CustomServiceProvider({
          id: serviceProvider.id,
          meta: serviceProvider.meta,
        }),
      ]
    : [
        new CustomServiceProvider(),
        new DevServiceProvider(),
        new TestingServiceProvider(),
      ];

  registerServiceProviders(providers);
});

const AppRemoteStateProvider = RemoteStateProvider<ProcessRequestsService>;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRemoteStateProvider
      url={bootstrapConfig.ws}
      fallback={createFallbackAppRemoteStateClient}
      debug={bootstrapConfig.debug}
    >
      <MantineProvider forceColorScheme={bootstrapConfig.scheme}>
        <Notifications />
        <App
          compact={bootstrapConfig.compact}
          initialService={serviceProvider}
        />
      </MantineProvider>
    </AppRemoteStateProvider>
  </StrictMode>,
);
