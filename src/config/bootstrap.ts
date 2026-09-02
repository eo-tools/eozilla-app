const COMPACT_QUERY_PARAM = "compact";
const DEBUG_QUERY_PARAM = "debug";
// `proxy` is the browser-visible Jupyter Server Proxy base URL. The resolver
// enforces that only loopback service URLs use it.
const PROXY_QUERY_PARAM = "proxy";
const SCHEME_QUERY_PARAM = "scheme";
// A Cuiman launch code is an opaque, one-shot bootstrap capability.  It never
// contains provider configuration or processing-service credentials.
const LAUNCH_QUERY_PARAM = "launch";
const WEBSOCKET_QUERY_PARAM = "ws";

export type AppColorScheme = "dark" | "light";

export interface AppBootstrapConfig {
  compact: boolean;
  debug: boolean;
  proxy: string | null;
  scheme: AppColorScheme | undefined;
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
  const ws = params.get(WEBSOCKET_QUERY_PARAM);
  const launchCode = params.get(LAUNCH_QUERY_PARAM);
  return { compact, debug, proxy, scheme, launchCode, ws };
}

function parseBooleanParam(value: string | null): boolean {
  return value === "1" || value === "true" || value === "";
}

function parseSchemeParam(value: string | null): AppColorScheme | undefined {
  return value === "dark" || value === "light" ? value : undefined;
}
