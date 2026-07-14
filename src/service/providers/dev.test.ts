import { describe, expect, it, vi } from "vitest";

const meta = {
  title: "Root",
  description: "Dev server",
};

vi.mock("@/service/services/url", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/service/services/url")>();
  return {
    ...actual,
    loadServiceRootMetadata: vi.fn(async () => meta),
  };
});

import { UrlService } from "@/service/services/url";
import { DevServiceProvider } from "./dev";

describe("DevServiceProvider", () => {
  it("creates a UrlService for the development server", async () => {
    const provider = new DevServiceProvider();

    const service = await provider.createService({});

    expect(service).toBeInstanceOf(UrlService);
    expect(service.providerId).toBe("dev");
    expect(service.apiUrl).toBe("http://localhost:8008");
    expect(service.meta).toBe(meta);
  });
});
