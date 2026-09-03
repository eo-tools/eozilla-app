import { describe, expect, it } from "vitest";

import {
  getHttpStatus,
  getResponseBodyReason,
  getResponseValueReason,
  HttpError,
} from "./http";

describe("HTTP error helpers", () => {
  it("formats an HTTP error with its status and optional detail", () => {
    const response = new Response(null, {
      status: 502,
      statusText: "Bad Gateway",
    });

    expect(getHttpStatus(response)).toBe("HTTP 502 Bad Gateway");
    expect(new HttpError(response, "Service unavailable").message).toBe(
      "HTTP 502 Bad Gateway: Service unavailable",
    );
  });

  it("extracts a JSON detail or plain-text response reason", async () => {
    expect(getResponseValueReason({ detail: "Unavailable" })).toBe(
      "Unavailable",
    );
    await expect(
      getResponseBodyReason(new Response("Gateway unavailable")),
    ).resolves.toBe("Gateway unavailable");
    await expect(
      getResponseBodyReason(
        new Response(JSON.stringify({ detail: "Unavailable" })),
      ),
    ).resolves.toBe("Unavailable");
  });
});
