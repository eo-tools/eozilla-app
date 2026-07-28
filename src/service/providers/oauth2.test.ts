import { beforeEach, describe, expect, it, vi } from "vitest";

import { OAuth2Auth } from "./oauth2";

const tokenStorageKey = "eozilla.oauth2.token";

describe("OAuth2Auth", () => {
  let storage: Map<string, string>;
  let assign: ReturnType<typeof vi.fn>;
  let replaceState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    storage = new Map();
    assign = vi.fn();
    replaceState = vi.fn();
    vi.stubGlobal("window", {
      crypto: globalThis.crypto,
      location: {
        origin: "https://eozilla.example",
        pathname: "/app/",
        search: "",
        assign,
      },
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
      history: { replaceState },
    });
    vi.stubGlobal("document", { title: "Eozilla" });
  });

  it("starts a generic OAuth2 Authorization Code + PKCE redirect", async () => {
    const auth = new OAuth2Auth({
      oauth2Protocol: "oauth2",
      authorizationEndpoint: "https://auth.example/authorize",
      tokenEndpoint: "https://auth.example/token",
      clientId: "eozilla-app",
      oauth2Scopes: "service.read",
    });

    await auth.signIn();

    expect(assign).toHaveBeenCalledOnce();
    const url = new URL(assign.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe("https://auth.example/authorize");
    expect(url.searchParams.get("client_id")).toBe("eozilla-app");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://eozilla.example/app/",
    );
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("scope")).toBe("service.read");
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
  });

  it("exchanges a callback code and creates bearer headers", async () => {
    storage.set("eozilla.oauth2.callback=unused", "unused");
    storage.set(
      "eozilla.oauth2.callback.callback-state",
      JSON.stringify({
        authorizationEndpoint: "https://auth.example/authorize",
        tokenEndpoint: "https://auth.example/token",
        clientId: "eozilla-app",
        codeVerifier: "verifier",
        redirectUri: "https://eozilla.example/app/",
      }),
    );
    window.location.search = "?code=code-value&state=callback-state";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "access-token", expires_in: 3600 }),
      }),
    );
    const auth = new OAuth2Auth({
      oauth2Protocol: "oauth2",
      authorizationEndpoint: "https://auth.example/authorize",
      tokenEndpoint: "https://auth.example/token",
      clientId: "eozilla-app",
    });

    const session = await auth.createAuth();

    expect(fetch).toHaveBeenCalledWith(
      "https://auth.example/token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(session.user).toEqual({
      id: "oauth2",
      displayName: "Authenticated User",
    });
    await expect(session.getHeaders()).resolves.toEqual({
      Authorization: "Bearer access-token",
    });
    expect(replaceState).toHaveBeenCalledWith(
      {},
      "Eozilla",
      "https://eozilla.example/app/",
    );
  });

  it("refreshes an expired generic OAuth2 token", async () => {
    storage.set(
      tokenStorageKey,
      JSON.stringify({
        accessToken: "expired-token",
        refreshToken: "refresh-token",
        expiresAt: Date.now() - 1,
      }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "refreshed-token",
          expires_in: 3600,
        }),
      }),
    );
    const auth = new OAuth2Auth({
      oauth2Protocol: "oauth2",
      authorizationEndpoint: "https://auth.example/authorize",
      tokenEndpoint: "https://auth.example/token",
      clientId: "eozilla-app",
    });

    const session = await auth.createAuth();

    await expect(session.getHeaders()).resolves.toEqual({
      Authorization: "Bearer refreshed-token",
    });
  });

  it("requires explicit OAuth2 endpoints", () => {
    expect(
      () =>
        new OAuth2Auth({
          oauth2Protocol: "oauth2",
          clientId: "eozilla-app",
        }),
    ).toThrow("Please provide a authorization endpoint.");
  });
});
