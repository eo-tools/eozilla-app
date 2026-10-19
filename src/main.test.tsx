import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { render } = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock("react-dom/client", () => ({ createRoot: () => ({ render }) }));
vi.mock("@/components/App", () => ({ default: () => null }));
vi.mock("@mantine/core", () => ({ MantineProvider: () => null }));
vi.mock("@mantine/notifications", () => ({ Notifications: () => null }));
vi.mock("@/components/common/CodeHighlightProvider", () => ({
  CodeHighlightProvider: () => null,
}));
vi.mock("remotestate", () => ({ RemoteStateProvider: () => () => null }));

describe.skipIf(typeof document !== "undefined")("app startup", () => {
  beforeEach(() => {
    vi.resetModules();
    render.mockClear();
    let location = new URL("https://app.test/index.html");
    vi.stubGlobal("window", {
      get location() {
        return location;
      },
      history: {
        replaceState: (_data: unknown, _unused: string, url: string) => {
          location = new URL(url, location);
        },
      },
    });
    vi.stubGlobal("document", {
      title: "Eozilla",
      getElementById: () => ({}),
      querySelector: () => ({ href: "", removeAttribute: () => {} }),
    });
    function memoryStorage() {
      const values = new Map<string, string>();
      return {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      };
    }
    vi.stubGlobal("localStorage", memoryStorage());
    vi.stubGlobal("sessionStorage", memoryStorage());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function start() {
    await import("./main");
    await vi.waitFor(() => expect(render).toHaveBeenCalledOnce());
  }

  it("selects a runtime service ahead of saved choices using the existing provider", async () => {
    const { storage } = await import("@/state/storage");
    storage.saveServiceProviderSelection({ id: "testing", options: {} });
    storage.saveTransientServiceProviderSelection({
      id: "cuiman",
      options: {},
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            branding: { title: "Standalone" },
            service: { apiUrl: "https://api.test/", authType: "token" },
          }),
        ),
      ),
    );
    await start();
    const { getAppState } = await import("@/store/store");
    const { getServiceProvider } = await import("@/service");
    expect(getAppState().serviceProviderId).toBe("configured");
    expect(storage.getServiceProviderOptions("configured")).toEqual({
      apiUrl: "https://api.test/",
      authType: "token",
    });
    expect(storage.serviceProviderSelection.get()?.id).toBe("testing");
    expect(getServiceProvider("configured").optionsSchema?.apiUrl.default).toBe(
      "https://api.test/",
    );
    expect(document.title).toBe("Standalone");
  });

  it.each([true, false])(
    "preserves saved-selection/dialog behavior without runtime settings (saved=%s)",
    async (saved) => {
      const { storage } = await import("@/state/storage");
      if (saved)
        storage.saveServiceProviderSelection({ id: "testing", options: {} });
      storage.saveTransientServiceProviderSelection({
        id: "cuiman",
        options: {},
      });
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
      );
      await start();
      const { getAppState } = await import("@/store/store");
      expect(getAppState().serviceProviderId).toBe(saved ? "testing" : null);
      expect(getAppState().dialogId).toBe(saved ? null : "service");
    },
  );

  it.each(["?launch=one-shot", "?cuiman=1"])(
    "uses Python branding and proxy settings in Cuiman mode: %s",
    async (query) => {
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${query}&title=Ignored&iconUrl=ignored`,
      );
      const fetchMock = vi
        .fn()
        .mockImplementation(async (url: URL | string) => {
          if (String(url).includes("_cuiman/launch"))
            return new Response(null, { status: 204 });
          return new Response(
            JSON.stringify({
              branding: {
                title: "Python",
                icon: { url: "./_cuiman/assets/icon" },
              },
              service: "ignored",
            }),
          );
        });
      vi.stubGlobal("fetch", fetchMock);
      await start();
      const { storage } = await import("@/state/storage");
      const { getServiceProviders } = await import("@/service");
      expect(getServiceProviders().map((p) => p.id)).toEqual(["cuiman"]);
      expect(storage.getServiceProviderOptions("cuiman")).toEqual({
        apiUrl: new URL("./_cuiman/service/", window.location.href).toString(),
        authType: "none",
      });
      expect(document.title).toBe("Python");
      expect(window.location.search).toContain("cuiman=1");
      expect(window.location.search).not.toContain("launch=");
      if (query.includes("launch"))
        expect(fetchMock.mock.calls[0][0]).toBe("./_cuiman/launch");
    },
  );

  it("shows a startup error for a Cuiman authentication failure", async () => {
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?cuiman=1`,
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
    );
    await start();
    expect(render.mock.calls[0][0]).toContain("config.json): HTTP 401");
  });
});
