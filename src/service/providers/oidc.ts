import { UserManager, WebStorageStateStore, type User } from "oidc-client-ts";

import type { UserIdentity } from "@/service";
import type { UrlServiceOptions } from "./url";

type OidcOptions = Pick<
  UrlServiceOptions,
  "issuerUrl" | "clientId" | "scopes" | "audience"
>;

export class OidcAuth {
  private readonly manager: UserManager;

  constructor(options: Partial<OidcOptions>) {
    if (!options.issuerUrl) {
      throw new Error("Please provide an OIDC issuer URL.");
    }
    if (!options.clientId) {
      throw new Error("Please provide an OIDC client ID.");
    }

    const appUrl = `${window.location.origin}${window.location.pathname}`;
    this.manager = new UserManager({
      authority: options.issuerUrl,
      client_id: options.clientId,
      redirect_uri: appUrl,
      post_logout_redirect_uri: appUrl,
      response_type: "code",
      scope: options.scopes || "openid profile email",
      automaticSilentRenew: false,
      stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
      userStore: new WebStorageStateStore({ store: window.sessionStorage }),
      extraQueryParams: options.audience
        ? { audience: options.audience }
        : undefined,
    });
  }

  async signIn(): Promise<void> {
    await this.manager.signinRedirect();
  }

  async signOut(): Promise<void> {
    // Local logout is reliable for every provider. A provider logout redirect can
    // be added later if the application needs single sign-out at the IdP.
    await this.manager.removeUser();
  }

  async createAuth(): Promise<{
    user: UserIdentity;
    getHeaders: () => Promise<Record<string, string>>;
  }> {
    let user = await this.completeSignInCallback();
    user ??= await this.manager.getUser();
    if (!user) {
      throw new Error("No OIDC session found. Please sign in again.");
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
    throw new Error("The OIDC session has expired. Please sign in again.");
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
