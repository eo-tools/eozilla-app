import { describe, expect, it } from "vitest";
import { TestingService } from "@/service/services/testing";
import { TestingServiceProvider } from "./testing";

describe("TestingServiceProvider", () => {
  it("creates in-memory testing services", async () => {
    const provider = new TestingServiceProvider();

    expect(provider.id).toBe("testing");
    expect(provider.meta).toEqual({
      type: "testing",
      title: "Testing Server (in-memory)",
    });
    expect(provider.optionsSchema).toEqual({});

    const service = await provider.createService({});
    expect(service).toBeInstanceOf(TestingService);
    expect(service.providerId).toBe("testing");
  });
});
