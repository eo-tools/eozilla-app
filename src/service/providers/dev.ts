import { UrlService } from "@/service/services/url";
import type {
  ServiceProvider,
  NoServiceOptions,
  ServiceProviderMeta,
} from "@/service/provider";
import { loadServiceRootMetadata } from "@/service/services/url";

export class DevServiceProvider implements ServiceProvider {
  readonly id = "dev";
  readonly meta: ServiceProviderMeta = {
    type: "dev",
    title: "Development Server",
  };
  readonly optionsSchema = {};

  signIn(_options: NoServiceOptions): Promise<void> {
    return Promise.resolve();
  }

  signOut(): Promise<void> {
    return Promise.resolve();
  }

  createService(_options: NoServiceOptions): Promise<UrlService> {
    const apiUrl = `http://localhost:8008`;
    return loadServiceRootMetadata(apiUrl).then(
      (meta) =>
        new UrlService(
          "dev",
          apiUrl,
          {
            id: "unknown",
            displayName: "anonymous User",
          },
          meta,
        ),
    );
  }
}
