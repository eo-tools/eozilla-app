import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createLocalStorageMock() {
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
    vi.stubGlobal("localStorage", createLocalStorageMock());
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
});
