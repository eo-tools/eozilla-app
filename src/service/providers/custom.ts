import { UrlService, type ApiHeadersProvider } from "@/service/services/url";
import { URL_SERVICE_OPTIONS_SCHEMA, type UrlServiceOptions } from "./url";
import type {
  ServiceProvider,
  ServiceProviderMeta,
  ServiceOptionsInput,
  UserIdentity,
} from "@/service";
import { loadServiceRootMetadata } from "@/service/services/url";
import { OAuth2Auth } from "./oauth2";

export interface CustomServiceProviderConfig {
  id?: string;
  meta?: ServiceProviderMeta;
}

const DEFAULT_CUSTOM_SERVICE_PROVIDER_META: ServiceProviderMeta = {
  type: "custom",
  title: "Custom Service",
};

export class CustomServiceProvider implements ServiceProvider<UrlServiceOptions> {
  readonly id: string;
  readonly meta: ServiceProviderMeta;
  readonly optionsSchema = URL_SERVICE_OPTIONS_SCHEMA;
  private oauth2Auth: OAuth2Auth | null = null;
  private loginSession: { key: string; accessToken: string } | null = null;

  constructor(config: CustomServiceProviderConfig = {}) {
    this.id = config.id ?? "custom";
    this.meta = config.meta ?? DEFAULT_CUSTOM_SERVICE_PROVIDER_META;
  }

  async signIn(options: ServiceOptionsInput<UrlServiceOptions>): Promise<void> {
    if (options.authType === "login") {
      await this.getLoginAccessToken(options);
      return;
    }
    const oauth2Options = getAuthorizationCodeOptions(options);
    if (oauth2Options) {
      this.oauth2Auth = new OAuth2Auth(oauth2Options);
      await this.oauth2Auth.signIn();
    }
  }

  async signOut(): Promise<void> {
    await this.oauth2Auth?.signOut();
    this.oauth2Auth = null;
    this.loginSession = null;
  }

  async createService(
    options: ServiceOptionsInput<UrlServiceOptions>,
  ): Promise<UrlService> {
    let user: UserIdentity = { id: "unknown", displayName: "Anonymous User" };
    const apiUrl =
      options.apiUrl ??
      (URL_SERVICE_OPTIONS_SCHEMA.apiUrl.default as string) ??
      "http://localhost:8008";
    let authHeaders: ApiHeadersProvider = createTokenAuthHeaders(options);
    if (options.authType === "login") {
      authHeaders = createAccessTokenHeaders({
        ...options,
        accessToken: await this.getLoginAccessToken(options),
      });
    }
    const oauth2Options = getAuthorizationCodeOptions(options);
    if (oauth2Options) {
      this.oauth2Auth = new OAuth2Auth(oauth2Options);
      const auth = await this.oauth2Auth.createAuth();
      user = auth.user;
      authHeaders = auth.getHeaders;
    }
    const meta = await loadServiceRootMetadata(apiUrl, authHeaders);
    return new UrlService(this.id, apiUrl, user, meta, authHeaders);
  }

  /** Obtain and retain the proprietary login token for the active options. */
  private async getLoginAccessToken(
    options: ServiceOptionsInput<UrlServiceOptions>,
  ): Promise<string> {
    if (options.accessToken) {
      return options.accessToken;
    }
    const loginUrl = requireHttpUrl(options.loginUrl, "login URL");
    const username = requireText(options.username, "username");
    const password = requireText(options.password, "password");
    const key = JSON.stringify({ loginUrl, username, password });
    if (this.loginSession?.key === key) {
      return this.loginSession.accessToken;
    }

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    });
    if (!response.ok) {
      throw new Error(`Login request failed (${response.status}).`);
    }
    const accessToken = parseLoginAccessToken(await response.text());
    this.loginSession = { key, accessToken };
    return accessToken;
  }
}

function getAuthorizationCodeOptions(
  options: ServiceOptionsInput<UrlServiceOptions>,
): Pick<
  UrlServiceOptions,
  | "authorizationServerUrl"
  | "authorizationEndpoint"
  | "tokenEndpoint"
  | "oauth2Protocol"
  | "clientId"
  | "oauth2Scopes"
> | null {
  if (
    options.authType !== "oauth2" ||
    (!options.authorizationServerUrl &&
      !(options.authorizationEndpoint && options.tokenEndpoint))
  ) {
    return null;
  }
  return {
    authorizationServerUrl: options.authorizationServerUrl,
    authorizationEndpoint: options.authorizationEndpoint,
    tokenEndpoint: options.tokenEndpoint,
    oauth2Protocol: options.oauth2Protocol,
    clientId: options.clientId,
    oauth2Scopes: options.oauth2Scopes,
  };
}

function createTokenAuthHeaders(
  options: ServiceOptionsInput<UrlServiceOptions>,
): Record<string, string> {
  switch (options.authType) {
    case "basic":
      return createBasicAuthHeaders(options);
    case "token":
    case "login":
    case "oauth2":
      return createAccessTokenHeaders(options);
    case "api-key":
      return createApiKeyAuthHeaders(options);
    default:
      return {};
  }
}

function createBasicAuthHeaders(
  options: ServiceOptionsInput<UrlServiceOptions>,
): Record<string, string> {
  if (!options.username || !options.password) {
    return {};
  }
  return {
    Authorization: `Basic ${btoa(`${options.username}:${options.password}`)}`,
  };
}

function createAccessTokenHeaders(
  options: ServiceOptionsInput<UrlServiceOptions>,
): Record<string, string> {
  if (!options.accessToken) {
    return {};
  }
  if (options.useBearer !== false) {
    return { Authorization: `Bearer ${options.accessToken}` };
  }
  return { [options.accessTokenHeader ?? "X-Auth-Token"]: options.accessToken };
}

function createApiKeyAuthHeaders(
  options: ServiceOptionsInput<UrlServiceOptions>,
): Record<string, string> {
  if (!options.apiKey) {
    return {};
  }
  return { [options.apiKeyHeader ?? "X-API-Key"]: options.apiKey };
}

function requireText(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`Please provide a ${name}.`);
  }
  return value.trim();
}

function requireHttpUrl(value: string | undefined, name: string): string {
  const url = requireText(value, name);
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return url;
    }
  } catch (_error) {
    // Use the common error below.
  }
  throw new Error(`Please provide a valid HTTP(S) ${name}.`);
}

function parseLoginAccessToken(responseBody: string): string {
  let value: unknown = responseBody.trim();
  try {
    value = JSON.parse(responseBody);
  } catch (_error) {
    // Proprietary login endpoints may return a plain-text token.
  }
  const token = findLoginAccessToken(value);
  if (!token) {
    throw new Error(
      "Login succeeded, but the server did not return an access token.",
    );
  }
  return token;
}

function findLoginAccessToken(value: unknown): string | null {
  if (typeof value === "string") {
    return value || null;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  for (const name of [
    "token",
    "authToken",
    "auth_token",
    "accessToken",
    "access_token",
    "apiToken",
    "api_token",
  ]) {
    if (typeof record[name] === "string" && record[name]) {
      return record[name];
    }
  }
  for (const nested of Object.values(record)) {
    const token = findLoginAccessToken(nested);
    if (token) {
      return token;
    }
  }
  return null;
}
