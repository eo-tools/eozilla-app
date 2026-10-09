import { isLink, isQualifiedValue, type JobResult } from "@/service";

export function getOutputUrlError(
  href: unknown,
  baseUrl = globalThis.document?.baseURI ?? "http://localhost/",
): string | undefined {
  if (typeof href !== "string" || !href.trim()) {
    return "The output URL is missing or invalid.";
  }
  let url: URL;
  try {
    url = new URL(href, baseUrl);
  } catch {
    return "The output URL is missing or invalid.";
  }
  if (url.protocol === "file:") {
    return "Browsers cannot open local file URLs from this app. The service must provide an HTTP(S) output URL.";
  }
  if (!["http:", "https:", "data:", "blob:"].includes(url.protocol)) {
    return `The output URL uses the unsupported ${url.protocol} scheme. The service must provide an HTTP(S) output URL.`;
  }
}

export function getJobResultMimeType(jobResult: JobResult) {
  if (isLink(jobResult)) {
    return jobResult.type;
  }

  if (isQualifiedValue(jobResult)) {
    return jobResult.mediaType;
  }

  return undefined;
}

export function hasRenderedPreview(jobResult: JobResult) {
  const mimeType = getJobResultMimeType(jobResult);
  const media =
    isImageMimeType(mimeType) ||
    isAudioMimeType(mimeType) ||
    isVideoMimeType(mimeType);
  if (isLink(jobResult)) {
    return media || isIframeMimeType(mimeType);
  }
  if (!isQualifiedValue(jobResult)) return false;
  const source = createPreviewSource(
    mimeType,
    jobResult.value,
    jobResult.encoding,
  );
  return (
    ((media || isIframeMimeType(mimeType)) && !!source) ||
    ((mimeType === "text/html" || isMarkdownMimeType(mimeType)) &&
      typeof jobResult.value === "string")
  );
}

export function isImageMimeType(mimeType?: string) {
  return !!mimeType && mimeType.startsWith("image/");
}

export function isAudioMimeType(mimeType?: string) {
  return !!mimeType && mimeType.startsWith("audio/");
}

export function isVideoMimeType(mimeType?: string) {
  return !!mimeType && mimeType.startsWith("video/");
}

export function isIframeMimeType(mimeType?: string) {
  return (
    !!mimeType && (mimeType === "application/pdf" || mimeType === "text/html")
  );
}

export function isMarkdownMimeType(mimeType?: string) {
  return mimeType === "text/markdown";
}

export function isJsonMimeType(mimeType?: string) {
  return mimeType === "application/json" || !!mimeType?.endsWith("+json");
}

export function isTextMimeType(mimeType?: string) {
  return (
    !!mimeType &&
    (mimeType.startsWith("text/") ||
      isJsonMimeType(mimeType) ||
      mimeType === "application/xml" ||
      mimeType === "application/javascript")
  );
}

export function createPreviewSource(
  mimeType: string | undefined,
  value: unknown,
  encoding: string | undefined,
) {
  if (!mimeType || typeof value !== "string") {
    return undefined;
  }

  if (
    value.startsWith("data:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  if (encoding === "base64") {
    return `data:${mimeType};base64,${value}`;
  }

  return undefined;
}
