import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { RemoteStateProvider } from "remotestate";
import { SWRConfig } from "swr";
import { describe, expect, it, vi } from "vitest";

import { TestingService } from "@/service/services/testing";

// Run with vite.config.ts for browser interactions.
describe.skipIf(typeof document === "undefined")(
  "ProcessPanel validation",
  () => {
    it("shows inline errors from the first Run attempt and updates them on edit", async () => {
      const [
        { page },
        { createFallbackAppRemoteStateClient },
        { initAppStore, setAppState },
        { default: ProcessPanel },
      ] = await Promise.all([
        import("vitest/browser"),
        import("@/store/remotestate"),
        import("@/store/store"),
        import("./ProcessPanel"),
      ]);
      const service = new TestingService();
      vi.spyOn(service, "getProcess").mockImplementation(async (id) => ({
        id,
        title: id,
        version: "1.0.0",
        inputs: {
          message: {
            title: "Message",
            minOccurs: 1,
            schema: { type: "string", minLength: 3 },
          },
        },
        outputs: {},
      }));
      const executeProcess = vi.spyOn(service, "executeProcess");
      initAppStore(() => {});
      setAppState({ service, processId: "first-process" });

      const container = document.createElement("div");
      document.body.append(container);
      const root = createRoot(container);
      vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

      try {
        await act(async () =>
          root.render(
            <SWRConfig value={{ provider: () => new Map() }}>
              <RemoteStateProvider
                fallback={createFallbackAppRemoteStateClient}
              >
                <MantineProvider env="test">
                  <ProcessPanel />
                </MantineProvider>
              </RemoteStateProvider>
            </SWRConfig>,
          ),
        );

        const input = page.getByRole("textbox", { name: "Message" });
        const run = page.getByRole("button", { name: "Execute process" });
        const error = page.getByText("Must be at least 3 characters.", {
          exact: true,
        });

        await expect.element(input).toHaveValue("");
        await expect.element(error).not.toBeInTheDocument();
        await act(async () => input.fill("ab"));
        await expect.element(error).not.toBeInTheDocument();

        await act(async () => run.click());
        await expect.element(error).toBeVisible();
        expect(executeProcess).not.toHaveBeenCalled();

        await act(async () => input.fill("abc"));
        await expect.element(error).not.toBeInTheDocument();
        await act(async () => input.fill(""));
        await expect.element(error).toBeVisible();

        const processOptions = page.getByRole("button", {
          name: "Process options",
        });
        await act(async () => {
          await processOptions.hover();
          // Let the menu's hover delay elapse before interacting with it.
          await new Promise((resolve) => setTimeout(resolve, 120));
        });
        await act(async () =>
          page.getByRole("menuitem", { name: "Reset to defaults" }).click(),
        );
        await expect.element(error).not.toBeInTheDocument();
        await act(async () => run.click());
        await expect.element(error).toBeVisible();

        await act(async () => setAppState({ processId: "second-process" }));
        await expect.element(input).toHaveValue("");
        await expect.element(error).not.toBeInTheDocument();
        await act(async () => setAppState({ processId: "first-process" }));
        await expect.element(input).toHaveValue("");
        await expect.element(error).not.toBeInTheDocument();
      } finally {
        await act(async () => root.unmount());
        container.remove();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
      }
    });
  },
);
