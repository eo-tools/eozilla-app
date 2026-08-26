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

  constructor(config: CustomServiceProviderConfig = {}) {
    this.id = config.id ?? "custom";
    this.meta = config.meta ?? DEFAULT_CUSTOM_SERVICE_PROVIDER_META;
  }

  async signIn(options: ServiceOptionsInput<UrlServiceOptions>): Promise<void> {
    const oauth2Options = getAuthorizationCodeOptions(options);
    if (oauth2Options) {
      this.oauth2Auth = new OAuth2Auth(oauth2Options);
      await this.oauth2Auth.signIn();
    }
  }

  async signOut(): Promise<void> {
    await this.oauth2Auth?.signOut();
    this.oauth2Auth = null;
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
  if (options.useBearer === true) {
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
