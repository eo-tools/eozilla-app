import { beforeEach, describe, expect, it, vi } from "vitest";

const meta = {
  title: "Root",
  description: "Custom server",
};

vi.mock("@/service/services/url", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/service/services/url")>();
  return {
    ...actual,
    loadServiceRootMetadata: vi.fn(async () => meta),
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
    expect(service.meta).toBe(meta);
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
      accessToken: "secret",
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
      accessToken: "secret",
      accessTokenHeader: "X-Custom-Token",
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
      accessToken: "secret",
    });

    expect(loadServiceRootMetadata).toHaveBeenCalledWith(
      "https://example.com/api/",
      { "X-Auth-Token": "secret" },
    );
    expect(service.defaultHeaders).toEqual({ "X-Auth-Token": "secret" });
  });

  it("uses an OAuth2 access token without starting a browser login flow", async () => {
    const provider = new CustomServiceProvider();

    const service = await provider.createService({
      apiUrl: "https://example.com/api/",
      authType: "oauth2",
      tokenUrl: "https://auth.example.test/token",
      grantType: "client_credentials",
      accessToken: "secret",
      useBearer: false,
      accessTokenHeader: "X-Service-Token",
    });

    expect(loadServiceRootMetadata).toHaveBeenCalledWith(
      "https://example.com/api/",
      { "X-Service-Token": "secret" },
    );
    expect(service.defaultHeaders).toEqual({ "X-Service-Token": "secret" });
  });

  it("passes basic auth headers to the URL service", async () => {
    const provider = new CustomServiceProvider();

    const service = await provider.createService({
      apiUrl: "https://example.com/api/",
      authType: "basic",
      username: "user",
      password: "secret",
    });

    expect(loadServiceRootMetadata).toHaveBeenCalledWith(
      "https://example.com/api/",
      { Authorization: "Basic dXNlcjpzZWNyZXQ=" },
    );
    expect(service.defaultHeaders).toEqual({
      Authorization: "Basic dXNlcjpzZWNyZXQ=",
    });
  });

  it("passes API key auth headers to the URL service", async () => {
    const provider = new CustomServiceProvider();

    const service = await provider.createService({
      apiUrl: "https://example.com/api/",
      authType: "api-key",
      apiKey: "secret",
      apiKeyHeader: "X-Service-Key",
    });

    expect(loadServiceRootMetadata).toHaveBeenCalledWith(
      "https://example.com/api/",
      { "X-Service-Key": "secret" },
    );
    expect(service.defaultHeaders).toEqual({ "X-Service-Key": "secret" });
  });
});
