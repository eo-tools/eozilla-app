import { isObject } from "./common";

export class HttpError extends Error {
  readonly response: Response;

  constructor(response: Response, reason?: string) {
    const status = getHttpStatus(response);
    super(reason ? `${status}: ${reason}` : status);
    this.response = response;
  }
}

export function getHttpStatus(response: Response): string {
  return `HTTP ${response.status}${
    response.statusText ? ` ${response.statusText}` : ""
  }`;
}

export function getResponseValueReason(data: unknown): string | undefined {
  if (isObject(data) && "detail" in data && typeof data.detail === "string") {
    return data.detail;
  }
  return typeof data === "string" && data ? data : undefined;
}

export async function getResponseBodyReason(
  response: Response,
): Promise<string | undefined> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return getResponseValueReason(JSON.parse(text)) ?? text;
  } catch {
    return text;
  }
}
