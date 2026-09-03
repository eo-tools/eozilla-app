import type { ServiceOptions, ServiceOptionsInput } from "@/service";

export function canAutoConnect(
  options: ServiceOptionsInput<ServiceOptions>,
): boolean {
  switch (options.authType) {
    case "none":
      return true;
    case "token":
      return Boolean(options.accessToken);
    case "api-key":
      return Boolean(options.apiKey);
    case "basic":
      return Boolean(options.username && options.password);
    case "login":
      return Boolean(
        options.accessToken ||
          (options.loginUrl && options.username && options.password),
      );
    case "oauth2":
      return Boolean(options.accessToken);
    default:
      return false;
  }
}
