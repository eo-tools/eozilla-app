import { describe, expect, it } from "vitest";
import { TestService } from "@/service/services/test";
import { TestServiceProvider } from "./test";

describe("TestServiceProvider", () => {
  it("creates in-memory test services", async () => {
    const provider = new TestServiceProvider();

    expect(provider.id).toBe("test");
    expect(provider.meta).toEqual({
      type: "test",
      title: "Test Server (in-memory)",
    });
    expect(provider.optionsSchema).toEqual({});

    const service = await provider.createService({});
    expect(service).toBeInstanceOf(TestService);
    expect(service.providerId).toBe("test");
  });
});
