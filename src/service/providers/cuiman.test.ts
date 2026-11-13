import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/service/services/url", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/service/services/url")>();
  return {
    ...actual,
    loadServiceRootMetadata: vi.fn(async () => ({
      title: "Processing Service",
    })),
  };
});

import { loadServiceRootMetadata } from "@/service/services/url";
import { CuimanServiceProvider } from "./cuiman";
import type { UrlServiceOptions } from "./url";

describe("CuimanServiceProvider", () => {
  const proxyUrl = "https://hub.test/user/me/proxy/8765/_cuiman/service/";
  const provider = new CuimanServiceProvider(proxyUrl);

  beforeEach(() => {
    vi.mocked(loadServiceRootMetadata).mockClear();
  });

  it("uses the proxy without browser authentication and restores form defaults", async () => {
    const options = {
      apiUrl: proxyUrl,
      authType: "none",
    } satisfies Partial<UrlServiceOptions>;
    await provider.signIn(options);
    const service = await provider.createService(options);

    expect(service.apiUrl).toBe(proxyUrl);
    expect(service.defaultHeaders).toEqual({});
    expect(loadServiceRootMetadata).toHaveBeenCalledWith(proxyUrl, {});
    expect(provider.optionsSchema.apiUrl.default).toBe(proxyUrl);
    expect(provider.optionsSchema.authType.default).toBe("none");
  });

  it.each([
    {},
    { apiUrl: "https://processing.test/", authType: "none" },
    { apiUrl: proxyUrl, authType: "login", loginUrl: "https://auth.test/" },
  ] satisfies Partial<UrlServiceOptions>[])(
    "rejects proxy bypass options before authentication or API calls: %j",
    async (options) => {
      await expect(provider.signIn(options)).rejects.toThrow(
        "Reload this tab to restore the proxy connection.",
      );
      await expect(provider.createService(options)).rejects.toThrow(
        "must use its local API proxy",
      );
      expect(loadServiceRootMetadata).not.toHaveBeenCalled();
    },
  );
});
