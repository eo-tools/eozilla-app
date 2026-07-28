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
  });

  it("uses Authorization Code + PKCE with the existing login options", async () => {
    mocks.manager.getUser.mockResolvedValue({
      access_token: "access-token",
      expired: false,
      profile: { sub: "user-1", preferred_username: "Ada" },
    });

    const auth = new OidcAuth({
      authUrl: "https://auth.example",
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

  it("requires the existing authentication URL and client ID fields", () => {
    expect(() => new OidcAuth({ clientId: "eozilla-app" })).toThrow(
      "Please provide an authentication URL.",
    );
    expect(() => new OidcAuth({ authUrl: "https://auth.example" })).toThrow(
      "Please provide a client ID.",
    );
  });
});
