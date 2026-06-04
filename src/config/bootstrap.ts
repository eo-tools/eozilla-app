import type {
  ServiceOptions,
  ServiceOptionsInput,
  ServiceProviderMeta,
} from "@/service";
import { isObject } from "@/utils/common";

const CONFIG_QUERY_PARAM = "config";
const COMPACT_QUERY_PARAM = "compact";

export interface SerializedAppConfig {
  serviceProviderId: string;
  serviceProviderMeta: ServiceProviderMeta;
  serviceProviderOptions: ServiceOptionsInput<ServiceOptions>;
}

export interface AppBootstrapConfig {
  compact: boolean;
  config: SerializedAppConfig | null;
}

function parseBooleanParam(value: string | null): boolean {
  return value === "1" || value === "true" || value === "";
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

export function parseSerializedAppConfig(
  value: unknown,
): SerializedAppConfig | null {
  if (!isObject(value)) {
    return null;
  }
  const serviceProviderId = value.serviceProviderId;
  const serviceProviderMeta = parseServiceProviderMeta(
    value.serviceProviderMeta,
  );
  const serviceProviderOptions = parseServiceProviderOptions(
    value.serviceProviderOptions,
  );
  if (
    typeof serviceProviderId !== "string" ||
    !serviceProviderId ||
    !serviceProviderMeta ||
    !serviceProviderOptions
  ) {
    return null;
  }
  return {
    serviceProviderId,
    serviceProviderMeta,
    serviceProviderOptions,
  };
}

export function parseAppBootstrapConfig(
  search: string = window.location.search,
): AppBootstrapConfig {
  const params = new URLSearchParams(search);
  const compact = parseBooleanParam(params.get(COMPACT_QUERY_PARAM));
  const encodedConfig = params.get(CONFIG_QUERY_PARAM);
  if (!encodedConfig) {
    return { compact, config: null };
  }
  try {
    return {
      compact,
      config: parseSerializedAppConfig(decodeBase64UrlJson(encodedConfig)),
    };
  } catch (error) {
    console.warn("Failed to parse app bootstrap config.", error);
    return { compact, config: null };
  }
}
