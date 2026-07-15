import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const manager = {
    settings: { redirect_uri: "https://app.example.test/" },
    signinRedirect: vi.fn(),
    signinRedirectCallback: vi.fn(),
    signinSilent: vi.fn(),
    getUser: vi.fn(),
    removeUser: vi.fn(),
  };
  return {
    manager,
    UserManager: vi.fn(function UserManager(_settings: unknown) {
      return manager;
    }),
    WebStorageStateStore: vi.fn(function WebStorageStateStore(
      _settings: unknown,
    ) {}),
  };
});

vi.mock("oidc-client-ts", () => ({
  UserManager: mocks.UserManager,
  WebStorageStateStore: mocks.WebStorageStateStore,
}));

import { OidcAuth } from "./oidc";

const user = {
  access_token: "access-token",
  refresh_token: "refresh-token",
  expired: false,
  profile: {
    sub: "user-1",
    name: "Test User",
  },
};

describe("OidcAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.manager.getUser.mockResolvedValue(user);
    mocks.manager.signinRedirectCallback.mockResolvedValue(user);
    mocks.manager.signinSilent.mockResolvedValue(user);
    vi.stubGlobal("window", {
      location: {
        origin: "https://app.example.test",
        pathname: "/",
        search: "",
      },
      history: { replaceState: vi.fn() },
      sessionStorage: {},
    });
    vi.stubGlobal("document", { title: "Eozilla" });
  });

  it("configures Authorization Code + PKCE without a client secret", () => {
    new OidcAuth({
      issuerUrl: "https://id.example.test",
      clientId: "eozilla",
      scopes: "openid profile",
      audience: "ogc-api",
    });

    expect(mocks.UserManager).toHaveBeenCalledWith(
      expect.objectContaining({
        authority: "https://id.example.test",
        client_id: "eozilla",
        redirect_uri: "https://app.example.test/",
        response_type: "code",
        scope: "openid profile",
        automaticSilentRenew: false,
        extraQueryParams: { audience: "ogc-api" },
      }),
    );
    expect(mocks.UserManager.mock.calls[0][0]).not.toHaveProperty(
      "client_secret",
    );
    expect(mocks.WebStorageStateStore).toHaveBeenCalledTimes(2);
  });

  it("starts a redirect sign-in", async () => {
    const auth = new OidcAuth({
      issuerUrl: "https://id.example.test",
      clientId: "eozilla",
    });

    await auth.signIn();

    expect(mocks.manager.signinRedirect).toHaveBeenCalledOnce();
  });

  it("completes the callback and supplies bearer headers", async () => {
    window.location.search = "?code=abc&state=state-1";
    const auth = new OidcAuth({
      issuerUrl: "https://id.example.test",
      clientId: "eozilla",
    });

    const result = await auth.createAuth();

    expect(mocks.manager.signinRedirectCallback).toHaveBeenCalledOnce();
    expect(result.user).toEqual({ id: "user-1", displayName: "Test User" });
    await expect(result.getHeaders()).resolves.toEqual({
      Authorization: "Bearer access-token",
    });
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      "Eozilla",
      "https://app.example.test/",
    );
  });

  it("refreshes an expired access token before creating headers", async () => {
    mocks.manager.getUser.mockResolvedValue({
      ...user,
      expired: true,
    });
    const refreshedUser = { ...user, access_token: "refreshed-token" };
    mocks.manager.signinSilent.mockResolvedValue(refreshedUser);
    const auth = new OidcAuth({
      issuerUrl: "https://id.example.test",
      clientId: "eozilla",
    });
    const result = await auth.createAuth();

    await expect(result.getHeaders()).resolves.toEqual({
      Authorization: "Bearer refreshed-token",
    });
    expect(mocks.manager.signinSilent).toHaveBeenCalledOnce();
  });
});
