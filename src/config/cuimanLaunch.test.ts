import { afterEach, describe, expect, it, vi } from "vitest";

import { exchangeCuimanLaunch } from "./cuimanLaunch";

describe("exchangeCuimanLaunch", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the server's message only for an invalid launch response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: "The Cuiman app launch has expired or is no longer valid.",
          }),
          { status: 410, statusText: "Gone" },
        ),
      ),
    );

    await expect(exchangeCuimanLaunch("launch-code")).rejects.toThrow(
      "The Cuiman app launch has expired or is no longer valid.",
    );
  });

  it("reports other HTTP failures with their status and reason", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Method Not Allowed" }), {
          status: 405,
          statusText: "Method Not Allowed",
        }),
      ),
    );

    await expect(exchangeCuimanLaunch("launch-code")).rejects.toThrow(
      "Failed to validate app launch (HTTP 405 Method Not Allowed): Method Not Allowed.",
    );
  });
});
