import { isLink, isQualifiedValue, type JobResult } from "@/service";

export function getJobResultMimeType(jobResult: JobResult) {
  if (isLink(jobResult)) {
    return jobResult.type;
  }

  if (isQualifiedValue(jobResult)) {
    return jobResult.mediaType;
  }

  return undefined;
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
    !!mimeType &&
    (mimeType === "application/pdf" || mimeType === "text/html")
  );
}

export function isMarkdownMimeType(mimeType?: string) {
  return mimeType === "text/markdown";
}

export function isJsonMimeType(mimeType?: string) {
  return (
    mimeType === "application/json" ||
    !!mimeType?.endsWith("+json")
  );
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

  if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (encoding === "base64") {
    return `data:${mimeType};base64,${value}`;
  }

  return undefined;
}
