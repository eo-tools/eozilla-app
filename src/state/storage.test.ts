import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createStorageMock() {
  const data = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => (data.has(key) ? data.get(key)! : null)),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
    clear: vi.fn(() => {
      data.clear();
    }),
  } as unknown as Storage;
}

describe("storage", () => {
  let storageModule: typeof import("./storage");

  beforeEach(async () => {
    vi.resetModules();
    vi.stubGlobal("localStorage", createStorageMock());
    vi.stubGlobal("sessionStorage", createStorageMock());
    storageModule = await import("./storage");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("round-trips json values through localStorage", () => {
    const selection = {
      id: "custom",
      options: { apiUrl: "https://example.com" },
    };

    storageModule.storage.serviceProviderSelection.set(selection);
    expect(storageModule.storage.serviceProviderSelection.get()).toEqual(
      selection,
    );
  });

  it("returns null for missing or invalid json values", () => {
    expect(storageModule.storage.serviceProviderSelection.get()).toBeNull();

    localStorage.setItem("eozilla.serviceProviderSelection", "{invalid");
    expect(storageModule.storage.serviceProviderSelection.get()).toBeNull();
  });

  it("deletes values from localStorage", () => {
    storageModule.storage.serviceProviderSelection.set({
      id: "test",
      options: {},
    });
    storageModule.storage.serviceProviderSelection.delete();

    expect(storageModule.storage.serviceProviderSelection.get()).toBeNull();
  });

  it("keeps secrets in session storage", () => {
    storageModule.storage.saveServiceProviderSelection({
      id: "custom",
      options: {
        apiUrl: "https://example.com",
        accessToken: "secret",
      },
    });

    expect(storageModule.storage.serviceProviderSelection.get()).toEqual({
      id: "custom",
      options: { apiUrl: "https://example.com" },
      hasSecrets: true,
    });
    expect(storageModule.storage.getServiceProviderOptions("custom")).toEqual({
      apiUrl: "https://example.com",
      accessToken: "secret",
    });
  });

  it("uses a transient selection without replacing the standalone selection", () => {
    storageModule.storage.saveServiceProviderSelection({
      id: "custom",
      options: { apiUrl: "https://standalone.example.test" },
    });

    storageModule.storage.saveTransientServiceProviderSelection({
      id: "cuiman",
      options: { apiUrl: "https://cuiman.example.test/_cuiman/service/" },
    });

    expect(storageModule.storage.serviceProviderSelection.get()).toEqual({
      id: "custom",
      options: { apiUrl: "https://standalone.example.test" },
      hasSecrets: false,
    });
    expect(storageModule.storage.getActiveServiceProviderSelection()).toEqual({
      id: "cuiman",
      options: { apiUrl: "https://cuiman.example.test/_cuiman/service/" },
    });
    expect(storageModule.storage.getServiceProviderOptions("cuiman")).toEqual({
      apiUrl: "https://cuiman.example.test/_cuiman/service/",
    });
  });
});
