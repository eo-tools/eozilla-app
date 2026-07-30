import type { UserIdentity } from "@/service";
import type { UrlServiceOptions } from "./url";
import { OidcAuth } from "./oidc";

type OAuth2Options = Pick<
  UrlServiceOptions,
  | "authorizationServerUrl"
  | "authorizationEndpoint"
  | "tokenEndpoint"
  | "oauth2Protocol"
  | "clientId"
  | "oauth2Scopes"
>;

interface OAuth2Token {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

interface OAuth2CallbackState {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  codeVerifier: string;
  redirectUri: string;
}

const CALLBACK_STATE_PREFIX = "eozilla.oauth2.callback.";
const TOKEN_STORAGE_KEY = "eozilla.oauth2.token";

/**
 * Authorization Code + PKCE authentication for public browser clients.
 *
 * OIDC is selected when an issuer URL is supplied. Plain OAuth2 uses explicit
 * authorization and token endpoints and intentionally has no identity claims.
 */
export class OAuth2Auth {
  private readonly oidcAuth: OidcAuth | null;
  private readonly scopes: string | undefined;
  private readonly options: Required<
    Pick<OAuth2Options, "authorizationEndpoint" | "tokenEndpoint" | "clientId">
  > | null;

  constructor(options: Partial<OAuth2Options>) {
    if ((options.oauth2Protocol ?? "oidc") === "oidc") {
      this.oidcAuth = new OidcAuth(options);
      this.options = null;
      this.scopes = undefined;
      return;
    }

    this.oidcAuth = null;
    this.options = {
      authorizationEndpoint: requireHttpUrl(
        options.authorizationEndpoint,
        "authorization endpoint",
      ),
      tokenEndpoint: requireHttpUrl(options.tokenEndpoint, "token endpoint"),
      clientId: requireText(options.clientId, "client ID"),
    };
    this.scopes = options.oauth2Scopes?.trim() || undefined;
  }

  async signIn(): Promise<void> {
    if (this.oidcAuth) {
      await this.oidcAuth.signIn();
      return;
    }

    const options = this.requireOptions();
    const state = randomValue();
    const codeVerifier = randomValue();
    const redirectUri = getRedirectUri();
    const callbackState: OAuth2CallbackState = {
      ...options,
      codeVerifier,
      redirectUri,
    };
    window.sessionStorage.setItem(
      `${CALLBACK_STATE_PREFIX}${state}`,
      JSON.stringify(callbackState),
    );

    const url = new URL(options.authorizationEndpoint);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", options.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("code_challenge", await sha256Base64Url(codeVerifier));
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("state", state);
    const scopes = this.optionsScopes();
    if (scopes) {
      url.searchParams.set("scope", scopes);
    }
    window.location.assign(url.toString());
  }

  async signOut(): Promise<void> {
    if (this.oidcAuth) {
      await this.oidcAuth.signOut();
      return;
    }
    window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  async createAuth(): Promise<{
    user: UserIdentity;
    getHeaders: () => Promise<Record<string, string>>;
  }> {
    if (this.oidcAuth) {
      return await this.oidcAuth.createAuth();
    }

    await this.completeCallback();
    if (!this.getStoredToken()) {
      throw new Error("No login session found. Please sign in again.");
    }
    return {
      user: { id: "oauth2", displayName: "Authenticated User" },
      getHeaders: async () => {
        const token = await this.getCurrentToken();
        return { Authorization: `Bearer ${token.accessToken}` };
      },
    };
  }

  private optionsScopes(): string | undefined {
    return this.scopes;
  }

  private async completeCallback(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("state");
    if (!state || (!params.has("code") && !params.has("error"))) {
      return;
    }
    const stateKey = `${CALLBACK_STATE_PREFIX}${state}`;
    const callbackState = readCallbackState(
      window.sessionStorage.getItem(stateKey),
    );
    window.sessionStorage.removeItem(stateKey);
    if (!callbackState) {
      throw new Error("No matching state found in storage.");
    }
    if (params.has("error")) {
      throw new Error(
        params.get("error_description") ||
          params.get("error") ||
          "Sign-in failed.",
      );
    }
    const code = params.get("code");
    if (!code) {
      throw new Error("The authorization server did not return a code.");
    }

    const token = await requestToken(callbackState.tokenEndpoint, {
      grant_type: "authorization_code",
      code,
      client_id: callbackState.clientId,
      redirect_uri: callbackState.redirectUri,
      code_verifier: callbackState.codeVerifier,
    });
    this.storeToken(token);
    window.history.replaceState({}, document.title, callbackState.redirectUri);
  }

  private async getCurrentToken(): Promise<OAuth2Token> {
    const token = this.getStoredToken();
    if (!token) {
      throw new Error("No login session found. Please sign in again.");
    }
    if (!token.expiresAt || token.expiresAt > Date.now()) {
      return token;
    }
    if (!token.refreshToken) {
      await this.signOut();
      throw new Error("The login session has expired. Please sign in again.");
    }

    const options = this.requireOptions();
    const refreshed = await requestToken(options.tokenEndpoint, {
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      client_id: options.clientId,
    });
    this.storeToken({
      ...refreshed,
      refreshToken: refreshed.refreshToken ?? token.refreshToken,
    });
    return this.getStoredToken() as OAuth2Token;
  }

  private getStoredToken(): OAuth2Token | null {
    const rawToken = window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!rawToken) {
      return null;
    }
    try {
      const token = JSON.parse(rawToken) as OAuth2Token;
      return typeof token.accessToken === "string" ? token : null;
    } catch (_error) {
      return null;
    }
  }

  private storeToken(token: OAuth2Token): void {
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
  }

  private requireOptions(): NonNullable<OAuth2Auth["options"]> {
    if (!this.options) {
      throw new Error("OAuth2 endpoints are not configured.");
    }
    return this.options;
  }
}

async function requestToken(
  tokenEndpoint: string,
  parameters: Record<string, string>,
): Promise<OAuth2Token> {
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(parameters),
  });
  const data: unknown = await response.json();
  if (!response.ok || !isTokenResponse(data)) {
    throw new Error("The authorization server did not return an access token.");
  }
  return {
    accessToken: data.access_token,
    refreshToken:
      typeof data.refresh_token === "string" ? data.refresh_token : undefined,
    expiresAt:
      typeof data.expires_in === "number"
        ? Date.now() + data.expires_in * 1000
        : undefined,
  };
}

function isTokenResponse(value: unknown): value is {
  access_token: string;
  refresh_token?: unknown;
  expires_in?: unknown;
} {
  return (
    typeof value === "object" &&
    value !== null &&
    "access_token" in value &&
    typeof value.access_token === "string"
  );
}

function readCallbackState(value: string | null): OAuth2CallbackState | null {
  if (!value) {
    return null;
  }
  try {
    const state = JSON.parse(value) as OAuth2CallbackState;
    return typeof state.authorizationEndpoint === "string" &&
      typeof state.tokenEndpoint === "string" &&
      typeof state.clientId === "string" &&
      typeof state.codeVerifier === "string" &&
      typeof state.redirectUri === "string"
      ? state
      : null;
  } catch (_error) {
    return null;
  }
}

function requireText(value: string | undefined, title: string): string {
  if (!value?.trim()) {
    throw new Error(`Please provide a ${title}.`);
  }
  return value.trim();
}

function requireHttpUrl(value: string | undefined, title: string): string {
  const url = requireText(value, title);
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
  } catch (_error) {
    // Use the common error below.
  }
  throw new Error(`Please provide a valid HTTP(S) ${title}.`);
}

function getRedirectUri(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function randomValue(): string {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function sha256Base64Url(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  return base64Url(await window.crypto.subtle.digest("SHA-256", bytes));
}

function base64Url(value: ArrayBuffer | Uint8Array): string {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
