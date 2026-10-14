import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JsonCode } from "./JsonCode";
import { JobResultDetails } from "@/components/panels/job/JobResultDetails";

// Use vite.config.ts for browser interactions; the default Node suite skips these.
describe.skipIf(typeof document === "undefined")("Mantine code viewers", () => {
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
    vi.unstubAllGlobals();
  });
  async function render(children: React.ReactNode) {
    await act(async () =>
      root.render(<MantineProvider env="test">{children}</MantineProvider>),
    );
  }
  async function click(selector: string) {
    await act(async () => {
      container.querySelector<HTMLButtonElement>(selector)!.click();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
  }
  it("parses JSON strings and renders untrusted values as text", async () => {
    await render(
      <JsonCode value={'{"message":"<script>alert(1)</script>"}'} />,
    );
    expect(container.querySelector('[role="tree"]')).not.toBeNull();
    expect(container.textContent).toContain("<script>alert(1)</script>");
    expect(container.querySelector("script")).toBeNull();
  });
  it.each(["array", "object"])(
    "shows and copies the complete %s within a scrollable panel",
    async (kind) => {
      const entries = Array.from(
        { length: 1000 },
        (_, index) => `entry-${index}`,
      );
      const value =
        kind === "array"
          ? entries
          : Object.fromEntries(entries.map((value, index) => [index, value]));
      await render(<JsonCode value={value} maxHeight="8rem" />);
      expect(container.textContent).toContain("entry-999");
      expect(container.textContent).not.toContain("Show all");
      expect(container.textContent).not.toContain("Show fewer");
      const panel = Array.from(
        container.querySelectorAll<HTMLElement>("[style]"),
      ).find((element) => element.style.maxHeight === "8rem")!;
      expect(panel.getBoundingClientRect().height).toBeLessThanOrEqual(128);
      expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
      const write = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue();
      await click('button[aria-label="Copy JSON"]');
      expect(JSON.parse(write.mock.calls[0]![0])).toEqual(value);
    },
  );
  it("keeps all entries of a nested large object accessible", async () => {
    const inputs = Object.fromEntries(
      Array.from({ length: 1000 }, (_, index) => [`input-${index}`, index]),
    );
    await render(<JsonCode value={{ request: { inputs } }} />);
    expect(container.textContent).not.toContain("input-999");
    await click('[role="treeitem"][aria-expanded="false"]');
    expect(container.textContent).toContain("input-999");
  });
  it.each(["inline", "qualified"])(
    "keeps a %s result box capped when nested values expand",
    async (kind) => {
      const value = {
        nested: { values: Array.from({ length: 100 }, (_, index) => index) },
      };
      const jobResult =
        kind === "qualified" ? { value, mediaType: "application/json" } : value;
      await render(<JobResultDetails jobResult={jobResult} />);
      const panel = Array.from(
        container.querySelectorAll<HTMLElement>("[style]"),
      ).find((element) => element.style.maxHeight === "8rem")!;
      const height = panel.getBoundingClientRect().height;
      const contentHeight = panel.scrollHeight;
      expect(height).toBeLessThanOrEqual(128);
      await click('[role="treeitem"][aria-expanded="false"]');
      expect(panel.getBoundingClientRect().height).toBeLessThanOrEqual(128);
      expect(panel.scrollHeight).toBeGreaterThan(contentHeight);
      expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
    },
  );
  it.each([
    { value: 7, mediaType: "application/json" },
    { value: "One line", mediaType: "text/plain" },
  ])(
    "fits single-line result content without filling the height limit",
    async (jobResult) => {
      await render(<JobResultDetails jobResult={jobResult} />);
      const panel = Array.from(
        container.querySelectorAll<HTMLElement>("[style]"),
      ).find((element) => element.style.maxHeight === "8rem")!;
      expect(panel.getBoundingClientRect().height).toBeGreaterThan(0);
      expect(panel.getBoundingClientRect().height).toBeLessThan(128);
      expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight);
    },
  );
  it("reveals the JSON copy action on keyboard focus", async () => {
    await render(<JsonCode value={{ count: 7 }} />);
    const copy = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Copy JSON"]',
    )!;
    await act(async () => copy.focus());
    expect(copy.style.opacity).toBe("1");
  });
  it("copies plain text with Mantine's built-in button and wraps lines", async () => {
    await render(<JsonCode value="  Plain text output" language="text" />);
    const write = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    await click('button[aria-label="Copy code"]');
    expect(write).toHaveBeenCalledWith("  Plain text output");
    expect(getComputedStyle(container.querySelector("pre")!).whiteSpace).toBe(
      "pre-wrap",
    );
  });
});
