import { describe, expect, it } from "vitest";
import {
  createPreviewSource,
  getOutputUrlError,
  hasRenderedPreview,
} from "./jobResultUtils";

describe("getOutputUrlError", () => {
  const base = "https://app.example/proxy/1234/";

  it.each([
    "https://outputs.example/result.nc?signature=abc",
    "http://localhost:8000/result.json",
    "reports/result.txt",
    "/outputs/result.txt",
    "//outputs.example/result.txt",
    "data:image/png;base64,AAAA",
    "blob:https://app.example/1234",
  ])("preserves browser-accessible links: %s", (href) => {
    expect(getOutputUrlError(href, base)).toBeUndefined();
  });

  it.each([undefined, null, 42, {}, "", "   ", "https://", "http://[invalid]"])(
    "reports missing or malformed URLs: %j",
    (href) => {
      expect(getOutputUrlError(href, base)).toBe(
        "The output URL is missing or invalid.",
      );
    },
  );

  it("explains the reported local-file failure", () => {
    expect(getOutputUrlError("file:///C:/outputs/summary.txt", base)).toContain(
      "cannot open local file URLs",
    );
  });

  it.each([
    "s3://bucket/key",
    "ftp://server/file",
    "javascript:alert(1)",
    "\tJaVaScRiPt:alert(1)",
  ])("rejects unsupported schemes: %s", (href) => {
    expect(getOutputUrlError(href, base)).toContain("unsupported");
  });

  it("preserves inline base64 previews", () => {
    const source = createPreviewSource("image/png", "AAAA", "base64");
    expect(source).toBe("data:image/png;base64,AAAA");
    expect(getOutputUrlError(source, base)).toBeUndefined();
  });
});

describe("hasRenderedPreview", () => {
  it("uses the content and format rather than the presence of a URL", () => {
    expect(hasRenderedPreview({ count: 1 })).toBe(false);
    expect(
      hasRenderedPreview({
        value: { count: 1 },
        mediaType: "application/json",
      }),
    ).toBe(false);
    expect(
      hasRenderedPreview({ href: "results/output.txt", type: "text/plain" }),
    ).toBe(false);
    expect(
      hasRenderedPreview({
        href: "results/output.nc",
        type: "application/x-netcdf",
      }),
    ).toBe(false);
    expect(
      hasRenderedPreview({ value: "No image source", mediaType: "image/png" }),
    ).toBe(false);
    expect(
      hasRenderedPreview({
        value: "AAAA",
        encoding: "base64",
        mediaType: "image/png",
      }),
    ).toBe(true);
    expect(
      hasRenderedPreview({
        value: "AAAA",
        encoding: "base64",
        mediaType: "application/pdf",
      }),
    ).toBe(true);
    expect(
      hasRenderedPreview({
        value: "**Rendered text**",
        mediaType: "text/markdown",
      }),
    ).toBe(true);
    expect(
      hasRenderedPreview({
        value: "<p>Rendered text</p>",
        mediaType: "text/html",
      }),
    ).toBe(true);
    expect(
      hasRenderedPreview({
        href: "results/output.pdf",
        type: "application/pdf",
      }),
    ).toBe(true);
  });
});
