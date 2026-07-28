import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";

import type { UserIdentity } from "@/service";
import type { UrlServiceOptions } from "./url";

type OidcOptions = Pick<
  UrlServiceOptions,
  "authorizationServerUrl" | "clientId" | "oauth2Scopes"
>;

/**
 * Authorization Code + PKCE login using the existing URL-provider options.
 *
 * `authorizationServerUrl` is the authorization server's base URL and
 * `clientId` identifies the public browser client. The OAuth2 flow uses OIDC
 * discovery and claims when the server supports them.
 */
export class OidcAuth {
  private readonly manager: UserManager;

  constructor(options: Partial<OidcOptions>) {
    if (!options.authorizationServerUrl?.trim()) {
      throw new Error("Please provide an authentication URL.");
    }
    if (!isHttpUrl(options.authorizationServerUrl)) {
      throw new Error("Please provide a valid HTTP(S) authentication URL.");
    }
    if (!options.clientId?.trim()) {
      throw new Error("Please provide a client ID.");
    }
    const scope = options.oauth2Scopes?.trim() || "openid profile email";
    if (!scope.split(/\s+/).includes("openid")) {
      throw new Error('OAuth2 scopes must include "openid" for login.');
    }

    const appUrl = `${window.location.origin}${window.location.pathname}`;
    this.manager = new UserManager({
      authority: options.authorizationServerUrl.trim(),
      client_id: options.clientId.trim(),
      redirect_uri: appUrl,
      response_type: "code",
      scope,
      automaticSilentRenew: false,
      stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    });
  }

  async signIn(): Promise<void> {
    await this.manager.signinRedirect();
  }

  async signOut(): Promise<void> {
    await this.manager.removeUser();
  }

  async createAuth(): Promise<{
    user: UserIdentity;
    getHeaders: () => Promise<Record<string, string>>;
  }> {
    let user = await this.completeSignInCallback();
    user ??= await this.manager.getUser();
    if (!user) {
      throw new Error("No login session found. Please sign in again.");
    }

    return {
      user: toUserIdentity(user),
      getHeaders: async () => {
        const currentUser = await this.getCurrentUser();
        return { Authorization: `Bearer ${currentUser.access_token}` };
      },
    };
  }

  private async completeSignInCallback(): Promise<User | null> {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("state") || (!params.has("code") && !params.has("error"))) {
      return null;
    }

    const user = await this.manager.signinRedirectCallback();
    window.history.replaceState(
      {},
      document.title,
      this.manager.settings.redirect_uri,
    );
    return user;
  }

  private async getCurrentUser(): Promise<User> {
    const user = await this.manager.getUser();
    if (user && !user.expired) {
      return user;
    }
    if (user?.refresh_token) {
      const refreshedUser = await this.manager.signinSilent();
      if (refreshedUser && !refreshedUser.expired) {
        return refreshedUser;
      }
    }
    await this.manager.removeUser();
    throw new Error("The login session has expired. Please sign in again.");
  }
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_error) {
    return false;
  }
}

function toUserIdentity(user: User): UserIdentity {
  const displayName =
    user.profile.name ||
    user.profile.preferred_username ||
    user.profile.email ||
    user.profile.sub;
  return { id: user.profile.sub, displayName };
}
