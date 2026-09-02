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
import { storage } from "@/state/storage";
import { initAppStore } from "@/store/store";
import App from "@/components/App";
import {
  createFallbackAppRemoteStateClient,
  type ProcessRequestsService,
} from "@/store/remotestate";

const bootstrapConfig = parseAppBootstrapConfig();
configureLocalUrlProxy(bootstrapConfig.proxy);
console.debug("bootstrapConfig:", bootstrapConfig);

// A Cuiman launch is deliberately different from a standalone SPA launch:
//
//   ?launch=<one-shot-code>
//     -> POST ./_cuiman/launch (sets an HttpOnly cookie)
//     -> one CustomServiceProvider using ./_cuiman/service/
//
// The relative paths are essential for remote JupyterLab.  Its Server Proxy
// exposes the app below /user/.../proxy/<port>/, which must remain part of
// every request rather than being replaced by window.location.origin.
void startApp();

async function startApp(): Promise<void> {
  const isCuimanLaunch = bootstrapConfig.launchCode !== null;
  if (isCuimanLaunch) {
    try {
      await exchangeCuimanLaunch(bootstrapConfig.launchCode!);
      removeLaunchCodeFromUrl();
    } catch (error) {
      renderLaunchError(error);
      return;
    }
  }

  initAppStore(() => {
    const providers: ServiceProvider<ServiceOptions>[] = isCuimanLaunch
      ? [
          new CustomServiceProvider({
            id: "cuiman",
            meta: {
              type: "custom",
              title: "Cuiman Service",
              description: "Service configured by Cuiman.",
            },
          }),
        ]
      : [
          new CustomServiceProvider(),
          new DevServiceProvider(),
          new TestingServiceProvider(),
        ];

    if (isCuimanLaunch) {
      // Keep the Cuiman provider separate from a user's persistent standalone
      // choice.  Reloading this launched tab still works, while opening the
      // standalone app later does not unexpectedly select Cuiman.
      storage.saveTransientServiceProviderSelection({
        id: "cuiman",
        options: {
          apiUrl: new URL(
            "./_cuiman/service/",
            window.location.href,
          ).toString(),
          authType: "none",
        },
      });
    }

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
          <App compact={bootstrapConfig.compact} />
        </MantineProvider>
      </AppRemoteStateProvider>
    </StrictMode>,
  );
}

async function exchangeCuimanLaunch(launchCode: string): Promise<void> {
  // Do not return provider options here.  The fixed, relative proxy route is
  // enough for the app; resolved upstream auth headers remain on Cuiman.
  const response = await fetch("./_cuiman/launch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ launch: launchCode }),
  });
  if (!response.ok) {
    throw new Error("The Cuiman app launch has expired or is no longer valid.");
  }
}

function removeLaunchCodeFromUrl(): void {
  // Retain public RemoteState/UI parameters such as `ws`, but remove the
  // one-shot capability before the user can copy, bookmark, or refresh it.
  const params = new URLSearchParams(window.location.search);
  params.delete("launch");
  const query = params.toString();
  window.history.replaceState(
    null,
    "",
    `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
  );
}

function renderLaunchError(error: unknown): void {
  const message = error instanceof Error ? error.message : "Unable to launch Cuiman.";
  createRoot(document.getElementById("root")!).render(message);
}
