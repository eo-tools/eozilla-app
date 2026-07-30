import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  manager: {
    getUser: vi.fn(),
    removeUser: vi.fn(),
    signinRedirect: vi.fn(),
    signinRedirectCallback: vi.fn(),
    signinSilent: vi.fn(),
    settings: { redirect_uri: "https://eozilla.example/app/" },
  },
  settings: undefined as unknown,
}));

vi.mock("oidc-client-ts", () => ({
  UserManager: class {
    constructor(settings: unknown) {
      mocks.settings = settings;
      return mocks.manager;
    }
  },
  WebStorageStateStore: class {
    constructor(_options: unknown) {}
  },
}));

import { OidcAuth } from "./oidc";

describe("OidcAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("window", {
      location: {
        origin: "https://eozilla.example",
        pathname: "/app/",
        search: "",
      },
      sessionStorage: {},
      history: { replaceState: vi.fn() },
    });
    vi.stubGlobal("document", { title: "Eozilla" });
  });

  it("uses Authorization Code + PKCE with the existing login options", async () => {
    mocks.manager.getUser.mockResolvedValue({
      access_token: "access-token",
      expired: false,
      profile: { sub: "user-1", preferred_username: "Ada" },
    });

    const auth = new OidcAuth({
      authorizationServerUrl: "https://auth.example",
      clientId: "eozilla-app",
    });
    const session = await auth.createAuth();

    expect(mocks.settings).toMatchObject({
      authority: "https://auth.example",
      client_id: "eozilla-app",
      response_type: "code",
      scope: "openid profile email",
    });
    expect(session.user).toEqual({ id: "user-1", displayName: "Ada" });
    await expect(session.getHeaders()).resolves.toEqual({
      Authorization: "Bearer access-token",
    });
  });

  it("uses the configured OAuth2 scopes", () => {
    new OidcAuth({
      authorizationServerUrl: "https://auth.example",
      clientId: "eozilla-app",
      oauth2Scopes: "openid service.read",
    });

    expect(mocks.settings).toMatchObject({
      scope: "openid service.read",
    });
  });

  it("completes a redirect callback and removes its query parameters", async () => {
    window.location.search = "?code=authorization-code&state=callback-state";
    mocks.manager.signinRedirectCallback.mockResolvedValue({
      access_token: "access-token",
      expired: false,
      profile: { sub: "user-1", preferred_username: "Ada" },
    });

    const auth = new OidcAuth({
      authorizationServerUrl: "https://auth.example",
      clientId: "eozilla-app",
    });
    const session = await auth.createAuth();

    expect(mocks.manager.signinRedirectCallback).toHaveBeenCalledOnce();
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      "Eozilla",
      "https://eozilla.example/app/",
    );
    expect(session.user).toEqual({ id: "user-1", displayName: "Ada" });
  });

  it("refreshes an expired session before returning request headers", async () => {
    mocks.manager.getUser
      .mockResolvedValueOnce({
        access_token: "initial-token",
        expired: false,
        profile: { sub: "user-1", preferred_username: "Ada" },
      })
      .mockResolvedValueOnce({
        access_token: "expired-token",
        expired: true,
        refresh_token: "refresh-token",
        profile: { sub: "user-1", preferred_username: "Ada" },
      });
    mocks.manager.signinSilent.mockResolvedValue({
      access_token: "refreshed-token",
      expired: false,
      profile: { sub: "user-1", preferred_username: "Ada" },
    });

    const auth = new OidcAuth({
      authorizationServerUrl: "https://auth.example",
      clientId: "eozilla-app",
    });
    const session = await auth.createAuth();

    await expect(session.getHeaders()).resolves.toEqual({
      Authorization: "Bearer refreshed-token",
    });
    expect(mocks.manager.signinSilent).toHaveBeenCalledOnce();
  });

  it("ends an expired session that cannot be refreshed", async () => {
    mocks.manager.getUser
      .mockResolvedValueOnce({
        access_token: "initial-token",
        expired: false,
        profile: { sub: "user-1", preferred_username: "Ada" },
      })
      .mockResolvedValueOnce({
        access_token: "expired-token",
        expired: true,
        profile: { sub: "user-1", preferred_username: "Ada" },
      });

    const auth = new OidcAuth({
      authorizationServerUrl: "https://auth.example",
      clientId: "eozilla-app",
    });
    const session = await auth.createAuth();

    await expect(session.getHeaders()).rejects.toThrow(
      "The login session has expired. Please sign in again.",
    );
    expect(mocks.manager.removeUser).toHaveBeenCalledOnce();
  });

  it("requires the existing authentication URL and client ID fields", () => {
    expect(() => new OidcAuth({ clientId: "eozilla-app" })).toThrow(
      "Please provide an authentication URL.",
    );
    expect(
      () => new OidcAuth({ authorizationServerUrl: "https://auth.example" }),
    ).toThrow("Please provide a client ID.");
  });

  it("rejects invalid OAuth2 configuration", () => {
    expect(
      () =>
        new OidcAuth({
          authorizationServerUrl: "not-a-url",
          clientId: "eozilla-app",
        }),
    ).toThrow("Please provide a valid HTTP(S) authentication URL.");
    expect(
      () =>
        new OidcAuth({
          authorizationServerUrl: "https://auth.example",
          clientId: "eozilla-app",
          oauth2Scopes: "profile email",
        }),
    ).toThrow('OAuth2 scopes must include "openid" for login.');
  });
});
