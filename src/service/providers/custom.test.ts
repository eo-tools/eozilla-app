import { beforeEach, describe, expect, it, vi } from "vitest";

const root = {
  title: "Root",
  description: "Custom server",
};

vi.mock("@/service/services/url", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/service/services/url")>();
  return {
    ...actual,
    loadServiceRootMetadata: vi.fn(async () => root),
  };
});

import { URL_SERVICE_OPTIONS_SCHEMA } from "./url";
import { UrlService, loadServiceRootMetadata } from "@/service/services/url";
import { CustomServiceProvider } from "./custom";

describe("CustomServiceProvider", () => {
  beforeEach(() => {
    vi.mocked(loadServiceRootMetadata).mockClear();
  });

  it("uses custom provider identity and metadata when configured", () => {
    const provider = new CustomServiceProvider({
      id: "notebook",
      meta: {
        type: "system",
        title: "Notebook Service",
        description: "Configured by Jupyter",
      },
    });

    expect(provider.id).toBe("notebook");
    expect(provider.meta).toEqual({
      type: "system",
      title: "Notebook Service",
      description: "Configured by Jupyter",
    });
  });

  it("uses the url service schema and custom api url", async () => {
    const provider = new CustomServiceProvider();

    expect(provider.optionsSchema).toBe(URL_SERVICE_OPTIONS_SCHEMA);

    const service = await provider.createService({
      apiUrl: "https://example.com/api/",
    });

    expect(service).toBeInstanceOf(UrlService);
    expect(service.providerId).toBe("custom");
    expect(service.apiUrl).toBe("https://example.com/api/");
    expect(service.root).toBe(root);
  });

  it("falls back to the default api url", async () => {
    const provider = new CustomServiceProvider();

    const service = await provider.createService({});

    expect(service.apiUrl).toBe("http://localhost:8008");
  });

  it("passes bearer token auth headers to the URL service", async () => {
    const provider = new CustomServiceProvider();

    const service = await provider.createService({
      apiUrl: "https://example.com/api/",
      authType: "token",
      token: "secret",
      useBearer: true,
    });

    expect(loadServiceRootMetadata).toHaveBeenCalledWith(
      "https://example.com/api/",
      { Authorization: "Bearer secret" },
    );
    expect(service.defaultHeaders).toEqual({ Authorization: "Bearer secret" });
  });

  it("passes custom token auth headers to the URL service", async () => {
    const provider = new CustomServiceProvider();

    const service = await provider.createService({
      apiUrl: "https://example.com/api/",
      authType: "token",
      token: "secret",
      tokenHeader: "X-Custom-Token",
    });

    expect(loadServiceRootMetadata).toHaveBeenCalledWith(
      "https://example.com/api/",
      { "X-Custom-Token": "secret" },
    );
    expect(service.defaultHeaders).toEqual({ "X-Custom-Token": "secret" });
  });

  it("uses X-Auth-Token as the default token auth header", async () => {
    const provider = new CustomServiceProvider();

    const service = await provider.createService({
      apiUrl: "https://example.com/api/",
      authType: "token",
      token: "secret",
    });

    expect(loadServiceRootMetadata).toHaveBeenCalledWith(
      "https://example.com/api/",
      { "X-Auth-Token": "secret" },
    );
    expect(service.defaultHeaders).toEqual({ "X-Auth-Token": "secret" });
  });

  it("does not pass auth headers for other auth types", async () => {
    const provider = new CustomServiceProvider();

    const service = await provider.createService({
      apiUrl: "https://example.com/api/",
      authType: "none",
      token: "secret",
    });

    expect(loadServiceRootMetadata).toHaveBeenCalledWith(
      "https://example.com/api/",
      {},
    );
    expect(service.defaultHeaders).toEqual({});
  });
});
