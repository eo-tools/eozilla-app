import { isObject, getErrorMessage } from "@/utils/common";
import {
  URL_SERVICE_OPTIONS_SCHEMA,
  type UrlServiceOptions,
} from "@/service/providers/url";

const COMPACT_QUERY_PARAM = "compact";
const DEBUG_QUERY_PARAM = "debug";
// `proxy` is the browser-visible Jupyter Server Proxy base URL. The resolver
// enforces that only loopback service URLs use it.
const PROXY_QUERY_PARAM = "proxy";
const SCHEME_QUERY_PARAM = "scheme";
const CUIMAN_QUERY_PARAM = "cuiman";
// A Cuiman launch code is an opaque, one-shot bootstrap capability.  It never
// contains provider configuration or processing-service credentials.
const LAUNCH_QUERY_PARAM = "launch";
// Standalone apps may provide their RemoteState endpoint explicitly. Cuiman
// derives it from the browser-visible app URL so Jupyter path prefixes remain
// intact without exposing a server URL in the query.
const WEBSOCKET_QUERY_PARAM = "ws";

export type AppColorScheme = "dark" | "light";

export interface AppBootstrapConfig {
  compact: boolean;
  debug: boolean;
  proxy: string | null;
  scheme: AppColorScheme | undefined;
  /** Whether this tab is a Cuiman-launched app session. */
  cuiman: boolean;
  /** One-shot Cuiman bootstrap capability, or null for a standalone app. */
  launchCode: string | null;
  ws: string | null;
}

export function parseAppBootstrapConfig(
  search: string = window.location.search,
): AppBootstrapConfig {
  const params = new URLSearchParams(search);
  const compact = parseBooleanParam(params.get(COMPACT_QUERY_PARAM));
  const debug = parseBooleanParam(params.get(DEBUG_QUERY_PARAM));
  const proxy = params.get(PROXY_QUERY_PARAM);
  const scheme = parseSchemeParam(params.get(SCHEME_QUERY_PARAM));
  const cuiman = parseBooleanParam(params.get(CUIMAN_QUERY_PARAM));
  const ws = params.get(WEBSOCKET_QUERY_PARAM);
  const launchCode = params.get(LAUNCH_QUERY_PARAM);
  return { compact, debug, proxy, scheme, cuiman, launchCode, ws };
}

/** Derive the RemoteState WebSocket URL from the browser-visible app URL. */
export function getCuimanWebSocketUrl(
  locationHref: string = window.location.href,
): string {
  const url = new URL("./ws", locationHref);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

/** Remove the one-shot code and retain only the non-sensitive Cuiman mode. */
export function getCuimanModeSearch(search: string): string {
  const params = new URLSearchParams(search);
  params.delete(LAUNCH_QUERY_PARAM);
  params.delete(WEBSOCKET_QUERY_PARAM);
  params.delete(PROXY_QUERY_PARAM);
  params.delete("_t");
  params.set(CUIMAN_QUERY_PARAM, "1");
  return params.toString();
}

function parseBooleanParam(value: string | null): boolean {
  return value === "1" || value === "true" || value === "";
}

function parseSchemeParam(value: string | null): AppColorScheme | undefined {
  return value === "dark" || value === "light" ? value : undefined;
}

/** Public image representation used by both static and Python configuration. */
export type AppIcon = { emoji: string } | { url: string };

/** Effective branding, with all built-in defaults applied. */
export interface AppBranding {
  title: string;
  favicon: string;
  icon: AppIcon;
}

/** Built-in branding used when deployment fields are absent or null. */
export const DEFAULT_APP_BRANDING: AppBranding = {
  title: "Eozilla",
  favicon: "./eozilla-small.svg",
  icon: { emoji: "🦖" },
};

const publicServiceFields = [
  "apiUrl",
  "authType",
  "loginUrl",
  "clientId",
  "useBearer",
  "accessTokenHeader",
  "apiKeyHeader",
  "authorizationServerUrl",
  "oauth2Protocol",
  "authorizationEndpoint",
  "tokenEndpoint",
  "oauth2Scopes",
] as const;

/** Deployment settings contain public connection options, never credentials. */
export type AppServiceConfig = Pick<
  UrlServiceOptions,
  (typeof publicServiceFields)[number]
>;

/** Validated runtime configuration, ready before React starts. */
export interface AppRuntimeConfig {
  branding: AppBranding;
  service?: AppServiceConfig;
}

/** Load optional app-relative configuration; only HTTP 404 means absent. */
export async function loadAppRuntimeConfig(
  isCuimanMode: boolean,
  locationHref: string = window.location.href,
): Promise<AppRuntimeConfig> {
  try {
    const response = await fetch(new URL("./config.json", locationHref), {
      headers: { Accept: "application/json" },
      credentials: "same-origin",
      cache: "no-store",
    });
    if (response.status === 404) {
      return { branding: { ...DEFAULT_APP_BRANDING } };
    }
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`.trim());
    }
    const value: unknown = await response.json();
    requireObject(value, "configuration");
    const branding = parseBranding(value.branding, locationHref);
    // Python owns the connection and credentials in Cuiman mode.
    const service =
      !isCuimanMode && value.service != null
        ? parseService(value.service)
        : undefined;
    return { branding, service };
  } catch (error) {
    throw new Error(
      `Unable to load app configuration (config.json): ${getErrorMessage(error)}`,
    );
  }
}

function parseBranding(value: unknown, baseUrl: string): AppBranding {
  const branding = { ...DEFAULT_APP_BRANDING };
  if (value == null) return branding;
  requireObject(value, "branding");
  for (const name of Object.keys(value)) {
    if (!["title", "favicon", "icon"].includes(name)) {
      throw new Error(`Unknown branding field: ${name}.`);
    }
  }
  if (value.title != null)
    branding.title = requireText(value.title, "branding.title");
  if (value.favicon != null) {
    branding.favicon = new URL(
      requireText(value.favicon, "branding.favicon"),
      baseUrl,
    ).toString();
  }
  if (value.icon != null) {
    requireObject(value.icon, "branding.icon");
    const keys = Object.keys(value.icon);
    if (keys.length !== 1 || !["emoji", "url"].includes(keys[0])) {
      throw new Error("branding.icon requires exactly one of emoji or url.");
    }
    branding.icon =
      keys[0] === "emoji"
        ? { emoji: requireText(value.icon.emoji, "branding.icon.emoji") }
        : {
            url: new URL(
              requireText(value.icon.url, "branding.icon.url"),
              baseUrl,
            ).toString(),
          };
  }
  return branding;
}

function parseService(value: unknown): AppServiceConfig {
  requireObject(value, "service");
  for (const [name, option] of Object.entries(value)) {
    if (!(publicServiceFields as readonly string[]).includes(name)) {
      throw new Error(`Unknown or non-public service field: ${name}.`);
    }
    const schema = URL_SERVICE_OPTIONS_SCHEMA[name];
    if (
      typeof option !== schema.type ||
      (typeof option === "string" && !option.trim()) ||
      (schema.enum && !(schema.enum as unknown[]).includes(option))
    ) {
      throw new Error(`Invalid service.${name}.`);
    }
    if (schema.type === "string" && schema.format === "uri") {
      const url = new URL(option as string);
      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password
      ) {
        throw new Error(
          `service.${name} requires an HTTP(S) URL without credentials.`,
        );
      }
    }
  }
  requireText(value.apiUrl, "service.apiUrl");
  const service = { authType: "none", ...value } as AppServiceConfig;
  if (service.authType === "login")
    requireText(service.loginUrl, "service.loginUrl");
  if (service.authType === "oauth2") {
    requireText(service.clientId, "service.clientId");
    if ((service.oauth2Protocol ?? "oidc") === "oidc") {
      requireText(
        service.authorizationServerUrl,
        "service.authorizationServerUrl",
      );
    } else {
      requireText(
        service.authorizationEndpoint,
        "service.authorizationEndpoint",
      );
      requireText(service.tokenEndpoint, "service.tokenEndpoint");
    }
  }
  return service;
}

function requireObject(
  value: unknown,
  name: string,
): asserts value is Record<string, unknown> {
  if (!isObject(value)) throw new Error(`${name} must be a JSON object.`);
}

function requireText(value: unknown, name: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} must be a nonempty string.`);
  }
  return value;
}

/** Apply browser-tab branding before rendering the application. */
export function applyAppBranding(branding: AppBranding): void {
  document.title = branding.title;
  let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.append(favicon);
  }
  favicon.removeAttribute("type");
  favicon.href = branding.favicon;
}
