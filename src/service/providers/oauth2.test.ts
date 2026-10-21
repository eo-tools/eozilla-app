import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OAuth2Auth } from "./oauth2";
import { CustomServiceProvider } from "./custom";

const tokenStorageKey = "eozilla.oauth2.token";
const connection = {
  apiUrl: "https://api.example/",
  oauth2Protocol: "oauth2" as const,
  authorizationEndpoint: "https://auth.example/authorize",
  tokenEndpoint: "https://auth.example/token",
  clientId: "eozilla-app",
  oauth2Scopes: "service.read",
};
const otherConnections = [
  { apiUrl: "https://other.example/" },
  { authorizationEndpoint: "https://other.example/authorize" },
  { tokenEndpoint: "https://other.example/token" },
  { clientId: "other-client" },
  { oauth2Scopes: "service.write" },
];

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
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ access_token: "access-token", expires_in: 3600 }),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function setCallbackUrl() {
    const redirect = new URL(assign.mock.lastCall![0]);
    window.location.search = `?code=code-value&state=${redirect.searchParams.get("state")}`;
  }

  async function signIn() {
    await new OAuth2Auth(connection).signIn();
    setCallbackUrl();
    const session = await new OAuth2Auth(connection).createAuth();
    // replaceState is mocked, so simulate removal of the callback parameters.
    window.location.search = "";
    vi.mocked(fetch).mockClear();
    return session;
  }

  it("starts a generic OAuth2 Authorization Code + PKCE redirect", async () => {
    const auth = new OAuth2Auth(connection);

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
    await new OAuth2Auth(connection).signIn();
    setCallbackUrl();
    const auth = new OAuth2Auth(connection);

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
    await signIn();
    const stored = JSON.parse(storage.get(tokenStorageKey)!);
    stored.token = {
      accessToken: "expired-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() - 1,
    };
    storage.set(tokenStorageKey, JSON.stringify(stored));
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
    const auth = new OAuth2Auth(connection);

    const session = await auth.createAuth();

    await expect(session.getHeaders()).resolves.toEqual({
      Authorization: "Bearer refreshed-token",
    });
    expect(fetch).toHaveBeenCalledWith(
      connection.tokenEndpoint,
      expect.objectContaining({
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: "refresh-token",
          client_id: connection.clientId,
        }),
      }),
    );
    // Refreshed tokens retain their binding and work after a reload.
    const restored = await new OAuth2Auth(connection).createAuth();
    await expect(restored.getHeaders()).resolves.toEqual({
      Authorization: "Bearer refreshed-token",
    });
  });

  it("restores a cached token for the same connection", async () => {
    await signIn();

    const session = await new OAuth2Auth(connection).createAuth();

    await expect(session.getHeaders()).resolves.toEqual({
      Authorization: "Bearer access-token",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(otherConnections)(
    "rejects a cached token when the connection changes: %j",
    async (changed) => {
      await signIn();

      await expect(
        new OAuth2Auth({ ...connection, ...changed }).createAuth(),
      ).rejects.toThrow("No login session found. Please sign in again.");

      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it.each(otherConnections)(
    "rejects a pending callback when the connection changes: %j",
    async (changed) => {
      await new OAuth2Auth(connection).signIn();
      setCallbackUrl();

      await expect(
        new OAuth2Auth({ ...connection, ...changed }).createAuth(),
      ).rejects.toThrow(
        "The service connection has changed. Please sign in again.",
      );

      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("ignores legacy tokens that have no connection binding", async () => {
    storage.set(
      tokenStorageKey,
      JSON.stringify({ accessToken: "legacy-token", refreshToken: "secret" }),
    );

    await expect(new OAuth2Auth(connection).createAuth()).rejects.toThrow(
      "No login session found. Please sign in again.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects legacy callbacks that have no connection binding", async () => {
    await new OAuth2Auth(connection).signIn();
    setCallbackUrl();
    const stateKey = [...storage.keys()][0]!;
    const callbackState = JSON.parse(storage.get(stateKey)!);
    delete callbackState.connectionKey;
    storage.set(stateKey, JSON.stringify(callbackState));

    await expect(new OAuth2Auth(connection).createAuth()).rejects.toThrow(
      "No matching state found in storage.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("never returns a different connection's token from existing headers", async () => {
    const session = await signIn();
    const other = new OAuth2Auth({
      ...connection,
      apiUrl: "https://other.example/",
    });
    await other.signIn();
    setCallbackUrl();
    await other.createAuth();
    window.location.search = "";
    vi.mocked(fetch).mockClear();

    await expect(session.getHeaders()).rejects.toThrow(
      "No login session found. Please sign in again.",
    );
    expect(fetch).not.toHaveBeenCalled();

    await new OAuth2Auth(connection).signOut();
    const restored = await other.createAuth();
    await expect(restored.getHeaders()).resolves.toEqual({
      Authorization: "Bearer access-token",
    });
  });

  it("clears the matching token on sign-out", async () => {
    await signIn();

    await new OAuth2Auth(connection).signOut();

    expect(storage.has(tokenStorageKey)).toBe(false);
    await expect(new OAuth2Auth(connection).createAuth()).rejects.toThrow(
      "No login session found. Please sign in again.",
    );
  });

  it("binds provider sign-in and restored services to their actual API URL", async () => {
    const provider = new CustomServiceProvider();
    const options = { ...connection, authType: "oauth2" as const };
    await provider.signIn(options);
    setCallbackUrl();
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: "access-token" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ title: "Service A" }),
      } as Response);

    const service = await provider.createService(options);

    expect(service.apiUrl).toBe(connection.apiUrl);
    expect(fetch).toHaveBeenLastCalledWith(
      connection.apiUrl,
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer access-token",
        }),
      }),
    );
    window.location.search = "";
    vi.mocked(fetch).mockClear();

    await expect(
      new CustomServiceProvider().createService({
        ...options,
        apiUrl: "https://other.example/",
      }),
    ).rejects.toThrow("No login session found. Please sign in again.");
    expect(fetch).not.toHaveBeenCalled();
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
