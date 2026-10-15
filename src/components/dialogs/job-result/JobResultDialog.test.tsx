import { MantineProvider } from "@mantine/core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  JobResultContent,
  JobResultDialog,
  JobResultPreview,
} from "./JobResultDialog";
import type { JobResult } from "@/service";

vi.mock("@/store/actions", () => ({
  closeDialog: vi.fn(),
  copyTextToClipboard: vi.fn(),
}));
vi.mock("@/store/hooks", () => ({
  useDialogOpened: () => true,
  useAppState: (selector: (state: { dialogData: unknown }) => unknown) =>
    selector({
      dialogData: {
        outputName: "result",
        jobResult: { href: "https://example.com/result.png" },
      },
    }),
}));

describe("JobResultPreview", () => {
  it("opens the dialog with the data sent by the View output action", () => {
    expect(JobResultDialog()).not.toBeNull();
  });

  it("shows an inline error without attempting to load a local file", () => {
    const markup = renderToStaticMarkup(
      <MantineProvider>
        <JobResultPreview
          jobResult={{
            href: "file:///C:/outputs/result.png",
            type: "image/png",
          }}
          mimeType="image/png"
        />
      </MantineProvider>,
    );
    expect(markup).toContain("Cannot preview output");
    expect(markup).toContain("cannot open local file URLs");
    expect(markup).not.toContain("<img");
  });

  it("retains sandboxing for linked HTML previews", () => {
    const markup = renderToStaticMarkup(
      <MantineProvider>
        <JobResultPreview
          jobResult={{ href: "reports/result.html", type: "text/html" }}
          mimeType="text/html"
        />
      </MantineProvider>,
    );
    expect(markup).toContain('src="reports/result.html"');
    expect(markup).toContain('sandbox=""');
    expect(markup).not.toContain("Cannot preview output");
  });
});

describe("JobResultContent", () => {
  function render(jobResult: JobResult) {
    return renderToStaticMarkup(
      <MantineProvider>
        <JobResultContent jobResult={jobResult} />
      </MantineProvider>,
    );
  }

  const inlineResults: JobResult[] = [
    { value: { count: 7 }, mediaType: "application/json" },
    { value: "Some output text", mediaType: "text/plain" },
    { count: 7 },
  ];
  it.each(inlineResults)(
    "shows inline JSON and text once, without tabs",
    (jobResult) => {
      const markup = render(jobResult);
      expect(markup).not.toContain('role="tab"');
      expect(markup).not.toContain("MIME Preview");
      expect(markup).toContain('aria-label="Copy ');
      expect(markup).not.toContain("Media Type");
    },
  );

  it("retains tabs for an inline image without a URL", () => {
    const markup = render({
      value: "AAAA",
      encoding: "base64",
      mediaType: "image/png",
    });
    expect(markup.match(/role="tab"/g)).toHaveLength(2);
    expect(markup).toContain("Preview");
    expect(markup).toContain("Raw");
    expect(markup).toContain('src="data:image/png;base64,AAAA"');
  });

  it("shows unsupported linked formats as details with a download action", () => {
    const markup = render({
      href: "results/output.nc",
      type: "application/x-netcdf",
    });
    expect(markup).not.toContain('role="tab"');
    expect(markup).not.toContain("No dedicated preview");
    expect(markup).toContain("Download output");
    expect(markup).toContain("Copy URL");
    expect(markup).toContain("results/output.nc");
  });
});
