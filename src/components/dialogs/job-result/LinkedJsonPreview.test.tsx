import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Link } from "@/service";
import { JobResultContent } from "@/components/dialogs/job-result/JobResultDialog";

vi.mock("@/store/actions", () => ({
  closeDialog: vi.fn(),
  copyTextToClipboard: vi.fn(),
}));
vi.mock("@/store/hooks", () => ({
  useDialogOpened: vi.fn(),
  useAppState: vi.fn(),
}));

// Run with vite.config.ts for actual browser JSON loading and viewer interactions.
describe.skipIf(typeof document === "undefined")("linked JSON previews", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });
  async function render(output: Link) {
    await act(async () =>
      root.render(
        <MantineProvider env="test">
          <JobResultContent jobResult={output} />
        </MantineProvider>,
      ),
    );
  }
  async function waitForPreview(selector: string) {
    await vi.waitFor(async () => {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(container.querySelector(selector)).not.toBeNull();
    });
  }
  it.each(["application/json", "application/geo+json"])(
    "previews and copies linked %s with the JSON viewer",
    async (type) => {
      const value = { message: "Linked JSON", nested: { values: [1, 2, 3] } };
      await render({
        href: `data:application/json,${encodeURIComponent(JSON.stringify(value))}`,
        type,
      });
      await waitForPreview('[role="tree"]');
      expect(container.textContent).toContain("Linked JSON");
      expect(container.querySelector("iframe")).toBeNull();
      expect(container.querySelector('[role="tablist"]')).toBeNull();
      const write = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue();
      await act(async () =>
        container
          .querySelector<HTMLButtonElement>('[aria-label="Copy JSON"]')!
          .click(),
      );
      expect(JSON.parse(write.mock.calls[0]![0])).toEqual(value);
    },
  );
  it.each(["http", "invalid", "network"])(
    "shows a preview error for a linked JSON %s failure",
    async (failure) => {
      const fetchOutput = vi.spyOn(globalThis, "fetch");
      if (failure === "network")
        fetchOutput.mockRejectedValue(new TypeError("Failed to fetch"));
      else
        fetchOutput.mockResolvedValue(
          new Response("invalid JSON", {
            status: failure === "http" ? 404 : 200,
          }),
        );
      await render({
        href: "https://outputs.example/result.json",
        type: "application/json",
      });
      await waitForPreview('[role="alert"]');
      expect(container.textContent).toContain("Cannot preview output");
      expect(container.querySelector('[role="tree"]')).toBeNull();
    },
  );
});
