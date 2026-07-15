import { UrlService } from "@/service/services/url";
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
    if (options.authType === "oidc") {
      this.oidcAuth = new OidcAuth(options);
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
    let user: UserIdentity = { id: "anonymous", displayName: "Anonymous User" };
    const apiUrl =
      options.apiUrl ??
      (URL_SERVICE_OPTIONS_SCHEMA.apiUrl.default as string) ??
      "http://localhost:8008";
    let authHeaders:
      | Record<string, string>
      | (() => Promise<Record<string, string>>) =
      createTokenAuthHeaders(options);
    if (options.authType === "oidc") {
      this.oidcAuth = new OidcAuth(options);
      const auth = await this.oidcAuth.createAuth();
      user = auth.user;
      authHeaders = auth.getHeaders;
    }
    const meta = await loadServiceRootMetadata(apiUrl, authHeaders);
    return new UrlService(this.id, apiUrl, user, meta, authHeaders);
  }
}

function createTokenAuthHeaders(
  options: ServiceOptionsInput<UrlServiceOptions>,
): Record<string, string> {
  if (options.authType !== "token" || !options.token) {
    return {};
  }
  if (options.useBearer === true) {
    return { Authorization: `Bearer ${options.token}` };
  }
  const tokenHeader = options.tokenHeader || "X-Auth-Token";
  return { [tokenHeader]: options.token };
}
