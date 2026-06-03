import { describe, expect, it, vi } from "vitest";

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
import { UrlService } from "@/service/services/url";
import { CustomServiceProvider } from "./custom";

describe("CustomServiceProvider", () => {
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
});
