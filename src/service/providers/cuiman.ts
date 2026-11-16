import type { ServiceOptionsInput } from "@/service";
import type { UrlService } from "@/service/services/url";
import { CustomServiceProvider } from "./custom";
import type { UrlServiceOptions } from "./url";

/** Keep Cuiman connections on the proxy owned by the launching Python client. */
export class CuimanServiceProvider extends CustomServiceProvider {
  private readonly proxyUrl: string;

  constructor(proxyUrl: string) {
    super({
      id: "cuiman",
      meta: {
        type: "dedicated",
        title: "Processing Service",
        description: "Service configured by the Python client.",
      },
      defaultOptions: { apiUrl: proxyUrl, authType: "none" },
    });
    this.proxyUrl = proxyUrl;
  }

  override async signIn(
    options: ServiceOptionsInput<UrlServiceOptions>,
  ): Promise<void> {
    this.requireProxyOptions(options);
  }

  override async createService(
    options: ServiceOptionsInput<UrlServiceOptions>,
  ): Promise<UrlService> {
    this.requireProxyOptions(options);
    return super.createService(options);
  }

  private requireProxyOptions(
    options: ServiceOptionsInput<UrlServiceOptions>,
  ): void {
    if (options.apiUrl !== this.proxyUrl || options.authType !== "none") {
      throw new Error(
        "This app was launched by Cuiman and must use its local API proxy. " +
          "Changing the service URL or browser authentication would bypass " +
          "Python authentication and may cause CORS errors. " +
          "Reload this tab to restore the proxy connection. " +
          "To change the processing service, configure the Python client " +
          "and launch the app again.",
      );
    }
  }
}
