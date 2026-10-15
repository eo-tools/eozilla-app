import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getCuimanModeSearch,
  getCuimanWebSocketUrl,
  parseAppBootstrapConfig,
  loadAppRuntimeConfig as loadRuntimeConfig,
  applyAppBranding,
  DEFAULT_APP_BRANDING,
} from "./bootstrap";

describe("parseAppBootstrapConfig", () => {
  it("parses public UI and Jupyter Server Proxy options", () => {
    expect(
      parseAppBootstrapConfig(
        `?compact=1&debug=1&proxy=${encodeURIComponent(
          "https://hub.example/user/test/proxy/",
        )}&scheme=dark&ws=ws://127.0.0.1:8743/ws`,
      ),
    ).toEqual({
      compact: true,
      debug: true,
      proxy: "https://hub.example/user/test/proxy/",
      scheme: "dark",
      cuiman: false,
      launchCode: null,
      ws: "ws://127.0.0.1:8743/ws",
    });
  });

  it("ignores invalid color scheme values", () => {
    expect(parseAppBootstrapConfig("?scheme=auto")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      cuiman: false,
      launchCode: null,
      ws: null,
    });
  });

  it("parses explicit compact mode false values", () => {
    expect(parseAppBootstrapConfig("?compact=0")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      cuiman: false,
      launchCode: null,
      ws: null,
    });
    expect(parseAppBootstrapConfig("?compact=false")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      cuiman: false,
      launchCode: null,
      ws: null,
    });
  });

  it("parses a Cuiman one-shot launch code", () => {
    expect(parseAppBootstrapConfig("?launch=opaque-code")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      cuiman: false,
      launchCode: "opaque-code",
      ws: null,
    });
  });

  it("parses the persistent Cuiman mode marker", () => {
    expect(parseAppBootstrapConfig("?cuiman=1")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      cuiman: true,
      launchCode: null,
      ws: null,
    });
  });

  it("derives a same-origin WebSocket URL for local and proxied apps", () => {
    expect(getCuimanWebSocketUrl("http://127.0.0.1:8765/index.html")).toBe(
      "ws://127.0.0.1:8765/ws",
    );
    expect(
      getCuimanWebSocketUrl(
        "https://hub.example/user/test/proxy/8765/index.html?cuiman=1",
      ),
    ).toBe("wss://hub.example/user/test/proxy/8765/ws");
  });

  it("replaces launch-only bootstrap parameters with the Cuiman mode marker", () => {
    expect(
      getCuimanModeSearch(
        "?compact=1&launch=opaque-code&ws=ws%3A%2F%2Flocalhost%2Fws&proxy=https%3A%2F%2Fhub.example%2Fproxy%2F&_t=123",
      ),
    ).toBe("compact=1&cuiman=1");
  });
});

describe("runtime app configuration", () => {
  afterEach(() => vi.unstubAllGlobals());

  function loadAppRuntimeConfig(
    isCuimanMode: boolean,
    locationHref = "https://app.test/index.html",
  ) {
    return loadRuntimeConfig(isCuimanMode, locationHref);
  }

  function respond(value: unknown, status = 200) {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(value), { status }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("fetches configuration relative to the visible app URL without caching", async () => {
    const fetchMock = respond({
      branding: {
        title: "Sen4CAP",
        favicon: "./assets/favicon.ico",
        icon: { url: "./_cuiman/assets/icon" },
      },
    });
    const config = await loadAppRuntimeConfig(
      true,
      "https://hub.test/user/me/proxy/8765/index.html?cuiman=1",
    );
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://hub.test/user/me/proxy/8765/config.json"),
      {
        cache: "no-store",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      },
    );
    expect(config.branding).toEqual({
      title: "Sen4CAP",
      favicon: "https://hub.test/user/me/proxy/8765/assets/favicon.ico",
      icon: { url: "https://hub.test/user/me/proxy/8765/_cuiman/assets/icon" },
    });
  });

  it.each([
    {},
    { branding: null },
    { branding: { title: null, favicon: null, icon: null } },
  ])("merges missing and null fields with defaults: %j", async (value) => {
    respond(value);
    expect((await loadAppRuntimeConfig(false)).branding).toEqual(
      DEFAULT_APP_BRANDING,
    );
  });

  it("supports emoji, origin-relative and external image URLs", async () => {
    respond({ branding: { favicon: "/favicon.ico", icon: { emoji: "🌍" } } });
    expect(
      (await loadAppRuntimeConfig(false, "https://app.test/sub/index.html"))
        .branding,
    ).toEqual({
      title: "Eozilla",
      favicon: "https://app.test/favicon.ico",
      icon: { emoji: "🌍" },
    });
    respond({ branding: { icon: { url: "https://images.test/logo.svg" } } });
    expect((await loadAppRuntimeConfig(false)).branding.icon).toEqual({
      url: "https://images.test/logo.svg",
    });
  });

  it("uses defaults only when config.json is absent", async () => {
    respond({}, 404);
    expect((await loadAppRuntimeConfig(false)).branding).toEqual(
      DEFAULT_APP_BRANDING,
    );
  });

  it.each([401, 403, 500])(
    "reports HTTP %i even in Cuiman mode",
    async (status) => {
      respond({}, status);
      await expect(loadAppRuntimeConfig(true)).rejects.toThrow(
        `HTTP ${status}`,
      );
    },
  );

  it("reports network and malformed JSON errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(loadAppRuntimeConfig(false)).rejects.toThrow(
      "config.json): offline",
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("<html>SPA fallback</html>")),
    );
    await expect(loadAppRuntimeConfig(false)).rejects.toThrow(
      "Unable to load app configuration",
    );
  });

  it.each([
    [[]],
    42,
    { branding: [] },
    { branding: { title: "" } },
    { branding: { title: 42 } },
    { branding: { extra: true } },
    { branding: { icon: {} } },
    { branding: { icon: { emoji: "🌍", url: "./logo.svg" } } },
    { branding: { icon: { path: "private.svg" } } },
  ])("rejects malformed branding: %j", async (value) => {
    respond(value);
    await expect(loadAppRuntimeConfig(false)).rejects.toThrow(
      "Unable to load app configuration",
    );
  });

  it("accepts public standalone service settings and ignores them in Cuiman mode", async () => {
    const service = {
      apiUrl: "https://api.test/",
      authType: "oauth2",
      oauth2Protocol: "oidc",
      authorizationServerUrl: "https://auth.test/",
      clientId: "browser",
      oauth2Scopes: "openid profile",
    };
    respond({ service });
    expect((await loadAppRuntimeConfig(false)).service).toEqual(service);
    respond({ service: { apiUrl: "untrusted", password: "secret" } });
    expect((await loadAppRuntimeConfig(true)).service).toBeUndefined();
  });

  it("defaults an omitted auth type to none", async () => {
    respond({ service: { apiUrl: "https://api.test/" } });
    expect((await loadAppRuntimeConfig(false)).service).toEqual({
      apiUrl: "https://api.test/",
      authType: "none",
    });
  });

  it.each([
    [[]],
    {},
    { apiUrl: "file:///local" },
    { apiUrl: "https://user:pass@api.test/" },
    { apiUrl: "https://api.test/", password: "secret" },
    { apiUrl: "https://api.test/", accessToken: "secret" },
    { apiUrl: "https://api.test/", authType: "unknown" },
    { apiUrl: "https://api.test/", useBearer: "yes" },
    { apiUrl: "https://api.test/", authType: "oauth2", clientId: "browser" },
    { apiUrl: "https://api.test/", authType: "login" },
  ])(
    "rejects malformed or credential-bearing service settings: %j",
    async (service) => {
      respond({ service });
      await expect(loadAppRuntimeConfig(false)).rejects.toThrow(
        "Unable to load app configuration",
      );
    },
  );

  it.skipIf(typeof document === "undefined")(
    "applies title and favicon and removes the built-in SVG MIME restriction",
    () => {
      const originalTitle = document.title;
      const favicon =
        document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      const originalHref = favicon?.getAttribute("href");
      try {
        applyAppBranding({
          ...DEFAULT_APP_BRANDING,
          title: "Custom",
          favicon: "https://app.test/favicon.ico",
        });
        expect(document.title).toBe("Custom");
        expect(
          document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href,
        ).toBe("https://app.test/favicon.ico");
        expect(
          document.querySelector('link[rel="icon"]')?.hasAttribute("type"),
        ).toBe(false);
      } finally {
        document.title = originalTitle;
        if (favicon && originalHref) favicon.setAttribute("href", originalHref);
        else document.querySelector('link[rel="icon"]')?.remove();
      }
    },
  );
});
