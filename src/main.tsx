import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// Note, order matters!
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { registerServiceProviders } from "@/service";
import { CustomServiceProvider } from "@/service/providers/custom";
import { DevServiceProvider } from "@/service/providers/dev";
import { TestServiceProvider } from "@/service/providers/test";
import { initAppStore } from "@/store/store";
import App from "@/components/App";

initAppStore(() => {
  registerServiceProviders([
    new CustomServiceProvider(),
    new DevServiceProvider(),
    new TestServiceProvider(),
  ]);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider>
      <Notifications />
      <App />
    </MantineProvider>
  </StrictMode>,
);
