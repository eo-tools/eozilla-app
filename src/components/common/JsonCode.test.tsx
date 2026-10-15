import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JsonCode } from "./JsonCode";
import { CodeHighlightProvider } from "./CodeHighlightProvider";
import { JobResultDetails } from "@/components/panels/job/JobResultDetails";
import JobResultView from "@/components/panels/job/JobResultView";
import type { JobResult } from "@/service";

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
  async function render(
    children: React.ReactNode,
    scheme: "light" | "dark" = "light",
  ) {
    await act(async () =>
      root.render(
        <MantineProvider env="test" forceColorScheme={scheme}>
          <CodeHighlightProvider>{children}</CodeHighlightProvider>
        </MantineProvider>,
      ),
    );
    await act(async () => {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
    });
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
  it.each([
    {
      mediaType: "text/html; charset=utf-8",
      value: "<p>Hello</p><script>alert(1)</script>",
      label: "HTML",
    },
    {
      mediaType: "text/markdown",
      value: "# Heading\n**Bold**",
      label: "MARKDOWN",
    },
    {
      mediaType: "image/svg+xml",
      value: '<svg><rect width="20" /></svg>',
      label: "SVG+XML",
    },
    {
      mediaType: "application/json",
      encoding: "base64",
      value: "eyJjb3VudCI6N30=",
      label: "BASE64",
    },
  ])(
    "labels $label from output metadata and preserves Copy and Expand",
    async ({ mediaType, value, label, encoding }) => {
      await render(
        <JobResultDetails
          jobResult={{ mediaType, value, ...(encoding ? { encoding } : {}) }}
        />,
      );
      expect(container.textContent).toContain(label);
      expect(container.querySelector("code")!.textContent).toBe(value);
      expect(!!container.querySelector('code [class^="hljs-"]')).toBe(
        !encoding,
      );
      expect(container.querySelector("script, h1, svg rect")).toBeNull();
      if (mediaType.startsWith("text/html"))
        expect(container.querySelector("code .hljs-tag")).not.toBeNull();
      const write = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue();
      await click('[aria-label="Copy code"]');
      expect(write).toHaveBeenCalledWith(value);
      await click('[aria-label="Expand code"]');
      const dialog = document.querySelector('[role="dialog"]')!;
      expect(dialog.textContent).toContain(label);
      expect(dialog.querySelector("code")!.textContent).toBe(value);
      expect(!!dialog.querySelector('code [class^="hljs-"]')).toBe(!encoding);
    },
  );
  it("detects HTML source without language or MIME metadata", async () => {
    const value = '<section class="result"><h1>Complete</h1></section>';
    await render(<JsonCode value={value} />);
    expect(container.querySelector("code")!.textContent).toBe(value);
    expect(container.querySelector('code [class^="hljs-"]')).not.toBeNull();
    expect(container.querySelector("section, h1")).toBeNull();
  });
  it("switches the supplied theme with the app color scheme", async () => {
    const source = <JsonCode value='<p class="result">Complete</p>' />;
    async function tokenColor() {
      await vi.waitFor(() =>
        expect(
          container.querySelector<HTMLLinkElement>('link[rel="stylesheet"]')!
            .sheet,
        ).not.toBeNull(),
      );
      return getComputedStyle(container.querySelector(".hljs-name")!).color;
    }
    await render(source, "light");
    const light = await tokenColor();
    await render(source, "dark");
    expect(await tokenColor()).not.toBe(light);
    await render(source, "light");
    expect(await tokenColor()).toBe(light);
  });
  it("reveals the JSON copy action on hover and keyboard focus", async () => {
    await render(<JsonCode value={{ count: 7 }} />);
    const copy = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Copy JSON"]',
    )!;
    expect(copy.parentElement!.style.opacity).toBe("0");
    await act(async () => {
      copy
        .closest(".mantine-Paper-root")!
        .dispatchEvent(new MouseEvent("mouseenter"));
    });
    expect(copy.parentElement!.style.opacity).toBe("1");
    await act(async () => {
      copy
        .closest(".mantine-Paper-root")!
        .dispatchEvent(new MouseEvent("mouseleave"));
    });
    expect(copy.parentElement!.style.opacity).toBe("0");
    await act(async () => copy.focus());
    expect(copy.parentElement!.style.opacity).toBe("1");
    expect(document.activeElement).toBe(copy);
  });
  it.each<JobResult>([
    { count: 7 },
    { value: "One line", mediaType: "text/plain" },
    { value: "AAAA", mediaType: "image/png", encoding: "base64" },
    { value: "AAAA", mediaType: "audio/wav", encoding: "base64" },
    { value: "AAAA", mediaType: "video/mp4", encoding: "base64" },
    { value: "<p>Sample</p>", mediaType: "text/html" },
    { value: "# Sample", mediaType: "text/markdown" },
  ])(
    "keeps result View distinct from code Copy and Expand",
    async (jobResult) => {
      const openDialog = vi.fn();
      await render(
        <JobResultView
          outputName="result"
          jobResult={jobResult}
          openDialog={openDialog}
        />,
      );
      const open = container.querySelector<HTMLButtonElement>(
        '[aria-label="View result result"]',
      )!;
      expect(open.textContent).toContain("View result");
      expect(container.textContent).not.toContain("Result #");
      expect(getComputedStyle(open).opacity).toBe("1");
      const copy = container.querySelector('[aria-label^="Copy"]')!;
      const expand = container.querySelector('[aria-label="Expand code"]')!;
      expect(copy.parentElement).toBe(expand.parentElement);
      expect(open.closest(".mantine-Paper-root")).toBeNull();
      expect(
        container.querySelectorAll('[aria-label="View result result"]'),
      ).toHaveLength(1);
      expect(container.querySelector('[aria-label^="Download"]')).toBeNull();
      expect(
        container.querySelector(
          '[aria-label="Open larger view"], [aria-label="Preview output"]',
        ),
      ).toBeNull();
      await click('[aria-label="View result result"]');
      expect(openDialog).toHaveBeenCalledWith("job-result", {
        outputName: "result",
        jobResult,
      });
    },
  );
  it("opens linked results without inline Download or Copy actions", async () => {
    const openDialog = vi.fn();
    const jobResult = {
      href: "https://example.com/result.nc",
      type: "application/x-netcdf",
    };
    await render(
      <JobResultView
        outputName="file"
        jobResult={jobResult}
        openDialog={openDialog}
      />,
    );
    const open = container.querySelector('[aria-label="View result file"]')!;
    expect(open.textContent).toContain("View result");
    expect(getComputedStyle(open).opacity).toBe("1");
    expect(container.querySelector('[aria-label^="Download"]')).toBeNull();
    expect(container.querySelector('[aria-label^="Copy"]')).toBeNull();
    await click('[aria-label="View result file"]');
    expect(openDialog).toHaveBeenCalledWith("job-result", {
      outputName: "file",
      jobResult,
    });
  });
  it.each([
    `https://example.com/${"a".repeat(500)}`,
    `data:application/pdf;base64,${"AAAA".repeat(200)}`,
    `data:application/json,${encodeURIComponent(JSON.stringify({ message: "a".repeat(500) }))}`,
  ])("wraps long result hrefs within a narrow panel", async (href) => {
    container.style.width = "300px";
    await render(
      <JobResultView
        outputName="file"
        jobResult={{ href }}
        openDialog={vi.fn()}
      />,
    );
    const link = container.querySelector<HTMLAnchorElement>("td a")!;
    const cell = link.closest("td")!;
    expect(link.getAttribute("href")).toBe(href);
    expect(link.textContent).toBe(href);
    expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth);
    expect(container.scrollWidth).toBeLessThanOrEqual(container.clientWidth);
  });
  it("provides Copy and Expand for the schema as well as the value", async () => {
    await render(
      <JobResultDetails
        jobResult={{
          value: { count: 7 },
          mediaType: "application/json",
          schema: { type: "object" },
        }}
      />,
    );
    expect(container.querySelectorAll('[aria-label^="Copy"]')).toHaveLength(2);
    expect(
      container.querySelectorAll('[aria-label="Expand code"]'),
    ).toHaveLength(2);
    expect(container.querySelectorAll('[role="tree"]')).toHaveLength(2);
  });
  it.each<{ count: number } | { value: string; mediaType: string }>([
    { count: 7 },
    { value: "One line", mediaType: "text/plain" },
  ])("keeps copying available after opening a result", async (jobResult) => {
    const { JobResultContent } =
      await import("@/components/dialogs/job-result/JobResultDialog");
    await render(<JobResultContent jobResult={jobResult} />);
    const write = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    expect(container.querySelectorAll('[aria-label^="Copy"]')).toHaveLength(1);
    await click('[aria-label^="Copy"]');
    expect(write).toHaveBeenCalledWith(
      "value" in jobResult
        ? jobResult.value
        : JSON.stringify(jobResult, null, 2),
    );
  });
  it("keeps download available inside the linked result dialog", async () => {
    const { JobResultContent } =
      await import("@/components/dialogs/job-result/JobResultDialog");
    await render(
      <JobResultContent
        jobResult={{
          href: "https://example.com/result.nc",
          type: "application/x-netcdf",
        }}
      />,
    );
    const download = container.querySelector("a[download]")!;
    expect(download.textContent).toContain("Download output");
    expect(download.getAttribute("href")).toBe("https://example.com/result.nc");
  });
  it.each(["json", "text"] as const)(
    "expands the exact %s content and keeps full copying available",
    async (language) => {
      const value =
        language === "json"
          ? Array.from({ length: 1000 }, (_, i) => i)
          : "Long output\n".repeat(100);
      await render(
        <JsonCode
          value={value}
          plainText={language === "text"}
          maxHeight="8rem"
        />,
      );
      await click('[aria-label="Expand code"]');
      const dialog = document.querySelector('[role="dialog"]')!;
      expect(dialog).not.toBeNull();
      expect(dialog.querySelector('[aria-label="Expand code"]')).toBeNull();
      const write = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue();
      await act(async () =>
        dialog
          .querySelector<HTMLButtonElement>('[aria-label^="Copy"]')!
          .click(),
      );
      expect(write).toHaveBeenCalledWith(
        language === "json" ? JSON.stringify(value, null, 2) : value,
      );
      expect(
        container.querySelector<HTMLElement>('[style*="max-height"]')!.style
          .maxHeight,
      ).toBe("8rem");
    },
  );
  it("copies plain text without changing whitespace and wraps lines", async () => {
    await render(<JsonCode value={"  Plain text output  \n"} plainText />);
    const write = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    await click('button[aria-label="Copy code"]');
    expect(write).toHaveBeenCalledWith("  Plain text output  \n");
    expect(getComputedStyle(container.querySelector("pre")!).whiteSpace).toBe(
      "pre-wrap",
    );
    const pre = container.querySelector("pre")!;
    const code = container.querySelector("code")!;
    const line = document.createRange();
    line.selectNodeContents(code);
    const copy = container.querySelector<HTMLButtonElement>(
      '[aria-label="Copy code"]',
    )!;
    expect(line.getBoundingClientRect().top).toBeGreaterThan(
      copy.getBoundingClientRect().bottom,
    );
    expect(pre.getBoundingClientRect().height).toBeLessThan(48);
    expect(code.getBoundingClientRect().right).toBeCloseTo(
      pre.getBoundingClientRect().right,
    );
  });
  it.each(["json", "text"] as const)(
    "keeps %s controls clear of the scrollbar",
    async (language) => {
      async function renderOutput(value: unknown) {
        await render(
          <div style={{ width: 320 }}>
            <JsonCode
              value={value}
              plainText={language === "text"}
              maxHeight="8rem"
            />
          </div>,
        );
      }
      await renderOutput(
        language === "json"
          ? Array.from({ length: 100 }, (_, index) => index)
          : "Long output\n".repeat(100),
      );
      const panel = Array.from(
        container.querySelectorAll<HTMLElement>("[style]"),
      ).find((element) => element.style.maxHeight === "8rem")!;
      expect(panel.scrollHeight).toBeGreaterThan(panel.clientHeight);
      const toolbar = container.querySelector<HTMLButtonElement>(
        '[aria-label^="Copy"]',
      )!.parentElement!;
      const toolbarPosition = toolbar.getBoundingClientRect();
      expect(toolbarPosition.bottom).toBeLessThanOrEqual(
        panel.getBoundingClientRect().top,
      );
      await act(async () => {
        panel.scrollTop = 100;
      });
      expect(toolbar.getBoundingClientRect().top).toBe(toolbarPosition.top);
      await renderOutput(language === "json" ? [1] : "Short output.");
      expect(panel.scrollHeight).toBeLessThanOrEqual(panel.clientHeight);
      expect(toolbar.getBoundingClientRect().right).toBe(toolbarPosition.right);
      expect(toolbar.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        panel.getBoundingClientRect().top,
      );
    },
  );
});
