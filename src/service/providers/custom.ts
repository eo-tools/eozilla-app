import { UrlService, type ApiHeadersProvider } from "@/service/services/url";
import { URL_SERVICE_OPTIONS_SCHEMA, type UrlServiceOptions } from "./url";
import type {
  ServiceProvider,
  ServiceProviderMeta,
  ServiceOptionsInput,
  UserIdentity,
} from "@/service";
import { loadServiceRootMetadata } from "@/service/services/url";
import { OidcAuth } from "./oidc";

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
  private oidcAuth: OidcAuth | null = null;

  constructor(config: CustomServiceProviderConfig = {}) {
    this.id = config.id ?? "custom";
    this.meta = config.meta ?? DEFAULT_CUSTOM_SERVICE_PROVIDER_META;
  }

  async signIn(options: ServiceOptionsInput<UrlServiceOptions>): Promise<void> {
    const oauth2Options = getAuthorizationCodeOptions(options);
    if (oauth2Options) {
      this.oidcAuth = new OidcAuth(oauth2Options);
      await this.oidcAuth.signIn();
    }
  }

  async signOut(): Promise<void> {
    await this.oidcAuth?.signOut();
    this.oidcAuth = null;
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
      this.oidcAuth = new OidcAuth(oauth2Options);
      const auth = await this.oidcAuth.createAuth();
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
  "authorizationServerUrl" | "clientId" | "oauth2Scopes"
> | null {
  if (
    options.authType === "oauth2" &&
    (options.oauth2GrantType ?? "authorization_code") === "authorization_code"
  ) {
    return {
      authorizationServerUrl: options.authorizationServerUrl,
      clientId: options.clientId,
      oauth2Scopes: options.oauth2Scopes,
    };
  }
  if (options.authType === "login") {
    return {
      authorizationServerUrl: options.authorizationServerUrl,
      clientId: options.clientId,
      oauth2Scopes: options.oauth2Scopes,
    };
  }
  return null;
}

function createTokenAuthHeaders(
  options: ServiceOptionsInput<UrlServiceOptions>,
): Record<string, string> {
  const token = options.accessToken ?? options.token;
  if (options.authType !== "token" || !token) {
    return {};
  }
  if (options.useBearer === true) {
    return { Authorization: `Bearer ${token}` };
  }
  const tokenHeader =
    options.accessTokenHeader ?? options.tokenHeader ?? "X-Auth-Token";
  return { [tokenHeader]: token };
}
