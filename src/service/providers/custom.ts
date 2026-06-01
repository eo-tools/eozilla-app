import { UrlService } from "@/service/services/url";
import { URL_SERVICE_OPTIONS_SCHEMA, type UrlServiceOptions } from "./url";
import type {
  ServiceProvider,
  ServiceProviderMeta,
  ServiceOptionsInput,
  UserIdentity,
} from "@/service";
import { loadServiceRootMetadata } from "@/service/services/url";

export class CustomServiceProvider implements ServiceProvider<UrlServiceOptions> {
  readonly id: string = "custom";
  readonly meta: ServiceProviderMeta = {
    type: "custom",
    title: "Processing Service",
  };
  readonly optionsSchema = URL_SERVICE_OPTIONS_SCHEMA;

  signIn(_options: ServiceOptionsInput<UrlServiceOptions>): Promise<void> {
    return Promise.resolve(undefined);
  }

  signOut(): Promise<void> {
    return Promise.resolve(undefined);
  }

  createService(options: ServiceOptionsInput<UrlServiceOptions>) {
    // TODO: load user
    const user: UserIdentity = { id: "unknown", displayName: "anonymous User" };
    const apiUrl =
      options.apiUrl ??
      (URL_SERVICE_OPTIONS_SCHEMA.apiUrl.default as string) ??
      "http://localhost:8008";
    return loadServiceRootMetadata(apiUrl).then(
      (root) => new UrlService(this.id, apiUrl, user, root),
    );
  }
}
