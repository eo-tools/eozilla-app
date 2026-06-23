import type {
  ServiceOptions,
  ServiceOptionsInput,
  ServiceProviderMeta,
} from "@/service";
import { isObject } from "@/utils/common";

const COMPACT_QUERY_PARAM = "compact";
const DEBUG_QUERY_PARAM = "debug";
const SCHEME_QUERY_PARAM = "scheme";
const SERVICE_QUERY_PARAM = "service";
const WEBSOCKET_QUERY_PARAM = "ws";

export type AppColorScheme = "dark" | "light";

export interface AppBootstrapConfig {
  compact: boolean;
  debug: boolean;
  scheme: AppColorScheme | undefined;
  service: SerializedServiceProvider | null;
  ws: string | null;
}

export interface SerializedServiceProvider {
  id: string;
  meta: ServiceProviderMeta;
  options: ServiceOptionsInput<ServiceOptions>;
}

export function parseAppBootstrapConfig(
  search: string = window.location.search,
): AppBootstrapConfig {
  const params = new URLSearchParams(search);
  const compact = parseBooleanParam(params.get(COMPACT_QUERY_PARAM));
  const debug = parseBooleanParam(params.get(DEBUG_QUERY_PARAM));
  const scheme = parseSchemeParam(params.get(SCHEME_QUERY_PARAM));
  const ws = params.get(WEBSOCKET_QUERY_PARAM);
  const encodedService = params.get(SERVICE_QUERY_PARAM);
  let service = null;
  if (encodedService) {
    try {
      service = parseSerializedServiceProvider(
        decodeBase64UrlJson(encodedService),
      );
    } catch (error) {
      console.warn("Failed to parse value of parameter 'service'.", error);
    }
  }
  return { compact, debug, scheme, service, ws };
}

export function parseSerializedServiceProvider(
  value: unknown,
): SerializedServiceProvider | null {
  if (!isObject(value)) {
    return null;
  }
  const serviceProviderId = value.id;
  const serviceProviderMeta = parseServiceProviderMeta(value.meta);
  const serviceProviderOptions = parseServiceProviderOptions(value.options);
  if (
    typeof serviceProviderId !== "string" ||
    !serviceProviderId ||
    !serviceProviderMeta ||
    !serviceProviderOptions
  ) {
    return null;
  }
  return {
    id: serviceProviderId,
    meta: serviceProviderMeta,
    options: serviceProviderOptions,
  };
}

function parseBooleanParam(value: string | null): boolean {
  return value === "1" || value === "true" || value === "";
}

function parseSchemeParam(value: string | null): AppColorScheme | undefined {
  return value === "dark" || value === "light" ? value : undefined;
}

function decodeBase64UrlJson(value: string): unknown {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(paddedBase64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as unknown;
}

function parseServiceProviderMeta(value: unknown): ServiceProviderMeta | null {
  if (!isObject(value)) {
    return null;
  }
  if (typeof value.type !== "string" || typeof value.title !== "string") {
    return null;
  }
  if (
    value.type !== "test" &&
    value.type !== "dev" &&
    value.type !== "custom" &&
    value.type !== "system"
  ) {
    return null;
  }
  return {
    type: value.type,
    title: value.title,
    description:
      typeof value.description === "string" ? value.description : undefined,
    disabled: typeof value.disabled === "boolean" ? value.disabled : undefined,
    hidden: typeof value.hidden === "boolean" ? value.hidden : undefined,
  };
}

function parseServiceProviderOptions(
  value: unknown,
): ServiceOptionsInput<ServiceOptions> | null {
  if (!isObject(value)) {
    return null;
  }
  const options: ServiceOptionsInput<ServiceOptions> = {};
  Object.entries(value).forEach(([key, option]) => {
    if (
      typeof option === "string" ||
      typeof option === "number" ||
      typeof option === "boolean"
    ) {
      options[key] = option;
    }
  });
  return options;
}
