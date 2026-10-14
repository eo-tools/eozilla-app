import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import JobPanel from "./JobPanel";
import { copyJsonToClipboard } from "@/store/actions";

const fixture = vi.hoisted(() => ({
  results: { output: { count: 7 } },
  info: { jobID: "job-1", processID: "sample", status: "successful" },
  request: { inputs: { message: "Submitted input" } },
  hasRequest: true,
}));
vi.mock("@/store/hooks", () => ({
  useActiveJobId: () => "job-1",
  useActiveJobInfo: () => ({ data: fixture.info, jobInfo: fixture.info }),
  useActiveJobResults: () => ({
    data: fixture.results,
    jobResults: fixture.results,
  }),
  useJobRequests: () =>
    fixture.hasRequest ? { "job-1": { request: fixture.request } } : {},
}));
vi.mock("@/store/actions", () => ({
  copyJsonToClipboard: vi.fn(),
  copyTextToClipboard: vi.fn(),
  openDialog: vi.fn(),
}));

describe.skipIf(typeof document === "undefined")("job detail tabs", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(async () => {
    fixture.hasRequest = true;
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    await act(async () =>
      root.render(
        <MantineProvider env="test">
          <JobPanel />
        </MantineProvider>,
      ),
    );
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });
  async function select(label: string) {
    await act(async () =>
      Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
        .find((tab) => tab.textContent === label)!
        .click(),
    );
  }
  it("starts on Results and switches between the request and job info", async () => {
    expect(container.querySelectorAll('[role="tab"]')).toHaveLength(3);
    expect(
      container.querySelector('[role="tab"][aria-selected="true"]')!
        .textContent,
    ).toBe("Results (1)");
    expect(container.textContent).toContain("output");
    expect(container.textContent).not.toContain("Result #");
    await select("Request");
    expect(container.textContent).toContain("Submitted input");
    expect(
      container.querySelector('[aria-label="Open result output"]'),
    ).toBeNull();
    expect(container.querySelector('[aria-label="Copy JSON"]')).not.toBeNull();
    expect(
      container.querySelector('[aria-label="Expand code"]'),
    ).not.toBeNull();
    await select("Info");
    expect(container.textContent).toContain("successful");
    expect(container.textContent).not.toContain("Submitted input");
  });
  it("copies the complete results or job info for the selected tab", async () => {
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="Copy all results"]')!
        .click(),
    );
    expect(copyJsonToClipboard).toHaveBeenLastCalledWith(fixture.results);
    await select("Info");
    await act(async () =>
      container
        .querySelector<HTMLButtonElement>('[aria-label="Copy job info"]')!
        .click(),
    );
    expect(copyJsonToClipboard).toHaveBeenLastCalledWith(fixture.info);
    await select("Request");
    expect(
      container.querySelector(
        '[aria-label="Copy all results"], [aria-label="Copy job info"]',
      ),
    ).toBeNull();
  });
  it("explains when a stored request is unavailable", async () => {
    fixture.hasRequest = false;
    await select("Request");
    expect(container.textContent).toContain(
      "No associated process request found",
    );
    expect(container.querySelector('[aria-label="Copy JSON"]')).toBeNull();
  });
});
