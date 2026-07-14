import { UrlService } from "@/service/services/url";
import { URL_SERVICE_OPTIONS_SCHEMA, type UrlServiceOptions } from "./url";
import type {
  ServiceProvider,
  ServiceProviderMeta,
  ServiceOptionsInput,
  UserIdentity,
} from "@/service";
import { loadServiceRootMetadata } from "@/service/services/url";

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

  constructor(config: CustomServiceProviderConfig = {}) {
    this.id = config.id ?? "custom";
    this.meta = config.meta ?? DEFAULT_CUSTOM_SERVICE_PROVIDER_META;
  }

  signIn(_options: ServiceOptionsInput<UrlServiceOptions>): Promise<void> {
    return Promise.resolve(undefined);
  }

  signOut(): Promise<void> {
    return Promise.resolve(undefined);
  }

  createService(
    options: ServiceOptionsInput<UrlServiceOptions>,
  ): Promise<UrlService> {
    // TODO: load user
    const user: UserIdentity = { id: "unknown", displayName: "anonymous User" };
    const apiUrl =
      options.apiUrl ??
      (URL_SERVICE_OPTIONS_SCHEMA.apiUrl.default as string) ??
      "http://localhost:8008";
    const authHeaders = createTokenAuthHeaders(options);
    return loadServiceRootMetadata(apiUrl, authHeaders).then(
      (meta) => new UrlService(this.id, apiUrl, user, meta, authHeaders),
    );
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
