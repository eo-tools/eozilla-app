let proxyBase: URL | null = null;

/** Configure the Jupyter Server Proxy base for loopback service URLs only. */
export function configureLocalUrlProxy(baseUrl: string | null): void {
  if (baseUrl === null) {
    proxyBase = null;
    return;
  }

  try {
    const configuredProxyBase = new URL(baseUrl);
    if (
      configuredProxyBase.protocol !== "http:" &&
      configuredProxyBase.protocol !== "https:"
    ) {
      throw new Error(
        `Unsupported proxy protocol '${configuredProxyBase.protocol}'`,
      );
    }
    configuredProxyBase.pathname = `${configuredProxyBase.pathname.replace(
      /\/+$/,
      "",
    )}/`;
    configuredProxyBase.search = "";
    configuredProxyBase.hash = "";
    proxyBase = configuredProxyBase;
  } catch (error) {
    proxyBase = null;
    console.warn("Failed to configure the local URL proxy.", error);
  }
}

export function resolveAppUrl(value: string): string {
  if (proxyBase === null) {
    return value;
  }

  let localUrl;
  try {
    localUrl = new URL(value);
  } catch {
    return value;
  }

  const proxyPort = getUrlPort(localUrl);
  if (!isLoopbackHostname(localUrl.hostname) || proxyPort === null) {
    return value;
  }

  const proxyUrl = new URL(
    `${proxyPort}/${localUrl.pathname.replace(/^\/+/, "")}`,
    proxyBase,
  );
  proxyUrl.search = localUrl.search;
  proxyUrl.hash = localUrl.hash;

  if (localUrl.protocol === "ws:" || localUrl.protocol === "wss:") {
    proxyUrl.protocol = proxyBase.protocol === "https:" ? "wss:" : "ws:";
  }

  console.debug("[eozilla] proxied local URL", {
    source: `${localUrl.origin}${localUrl.pathname}`,
    target: `${proxyUrl.origin}${proxyUrl.pathname}`,
  });
  return proxyUrl.toString();
}

function isLoopbackHostname(hostname: string): boolean {
  const normalizedHostname = hostname.toLowerCase().replace(/\.$/, "");
  return (
    normalizedHostname === "localhost" ||
    normalizedHostname.endsWith(".localhost") ||
    /^127(?:\.\d{1,3}){3}$/.test(normalizedHostname) ||
    normalizedHostname === "::1" ||
    normalizedHostname === "[::1]"
  );
}

function getUrlPort(url: URL): string | null {
  if (url.port) return url.port;
  if (url.protocol === "http:" || url.protocol === "ws:") return "80";
  if (url.protocol === "https:" || url.protocol === "wss:") return "443";
  return null;
}
