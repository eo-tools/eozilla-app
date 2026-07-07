import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function createLocalStorageMock() {
  return {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  } as unknown as Storage;
}

describe("createInitialAppState", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("defaults process inputs to form mode", async () => {
    const { createInitialAppState } = await import("./types");

    expect(createInitialAppState().processInputEditorMode).toBe("form");
  });
});
