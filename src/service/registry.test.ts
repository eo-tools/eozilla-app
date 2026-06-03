import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ServiceOptions, ServiceProvider } from "./provider";

function createProvider(id: string): ServiceProvider<ServiceOptions> {
  return {
    id,
    meta: { type: "custom", title: id },
    signIn: vi.fn(async () => undefined),
    signOut: vi.fn(async () => undefined),
    createService: vi.fn(async () => {
      throw new Error("not needed in registry tests");
    }),
  };
}

describe("service registry", () => {
  let registry: typeof import("./registry");

  beforeEach(async () => {
    vi.resetModules();
    registry = await import("./registry");
  });

  it("registers, looks up, and unregisters a provider", () => {
    const provider = createProvider("custom");
    const unregister = registry.registerServiceProvider(provider);

    expect(registry.isServiceProviderId("custom")).toBe(true);
    expect(registry.getServiceProvider("custom")).toBe(provider);
    expect(registry.getServiceProviders()).toEqual([provider]);

    unregister();
    expect(registry.isServiceProviderId("custom")).toBe(false);
    expect(() => registry.getServiceProvider("custom")).toThrowError(
      "Unknown file system provider 'custom'",
    );
  });

  it("registers multiple providers and unregisters them together", () => {
    const one = createProvider("one");
    const two = createProvider("two");
    const unregister = registry.registerServiceProviders([one, two]);

    expect(registry.getServiceProviders()).toEqual([one, two]);

    unregister();
    expect(registry.getServiceProviders()).toEqual([]);
  });
});
