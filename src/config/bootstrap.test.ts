import { describe, expect, it, vi } from "vitest";

import { parseAppBootstrapConfig } from "./bootstrap";

function encodeBase64Url(value: unknown): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

describe("parseAppBootstrapConfig", () => {
  it("parses compact mode, debug, and the serialized service provider", () => {
    const encodedService = encodeBase64Url({
      id: "notebook",
      meta: {
        type: "system",
        title: "Notebook Service",
        description: "Configured by Jupyter",
        hidden: true,
      },
      options: {
        apiUrl: "https://example.test/ogcapi",
        authType: "token",
        token: "secret",
        useBearer: false,
        tokenHeader: "X-Auth-Token",
        ignoredObject: { value: "not supported" },
      },
    });

    expect(
      parseAppBootstrapConfig(
        `?compact=1&debug=1&proxy=${encodeURIComponent(
          "https://hub.example/user/test/proxy/",
        )}&scheme=dark&service=${encodedService}`,
      ),
    ).toEqual({
      compact: true,
      debug: true,
      proxy: "https://hub.example/user/test/proxy/",
      scheme: "dark",
      ws: null,
      launchCode: null,
      service: {
        id: "notebook",
        meta: {
          type: "system",
          title: "Notebook Service",
          description: "Configured by Jupyter",
          disabled: undefined,
          hidden: true,
        },
        options: {
          apiUrl: "https://example.test/ogcapi",
          authType: "token",
          token: "secret",
          useBearer: false,
          tokenHeader: "X-Auth-Token",
        },
      },
    });
  });

  it("ignores invalid serialized service provider values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(
      parseAppBootstrapConfig("?compact&scheme=dark&service=not-json"),
    ).toEqual({
      compact: true,
      debug: false,
      proxy: null,
      scheme: "dark",
      ws: null,
      launchCode: null,
      service: null,
    });

    warn.mockRestore();
  });

  it("preserves the renamed Cuiman authentication options", () => {
    const encodedService = encodeBase64Url({
      id: "client",
      meta: { type: "custom", title: "Client" },
      options: {
        apiUrl: "https://example.test/ogcapi",
        authType: "oauth2",
        tokenUrl: "https://auth.example.test/token",
        grantType: "client_credentials",
        accessToken: "secret",
        accessTokenHeader: "X-Service-Token",
        useBearer: false,
      },
    });

    expect(
      parseAppBootstrapConfig(`?service=${encodedService}`).service,
    ).toEqual({
      id: "client",
      meta: {
        type: "custom",
        title: "Client",
        description: undefined,
        disabled: undefined,
        hidden: undefined,
      },
      options: {
        apiUrl: "https://example.test/ogcapi",
        authType: "oauth2",
        tokenUrl: "https://auth.example.test/token",
        grantType: "client_credentials",
        accessToken: "secret",
        accessTokenHeader: "X-Service-Token",
        useBearer: false,
      },
    });
  });

  it("ignores invalid color scheme values", () => {
    expect(parseAppBootstrapConfig("?scheme=auto")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      ws: null,
      launchCode: null,
      service: null,
    });
  });

  it("parses explicit compact mode false values", () => {
    expect(parseAppBootstrapConfig("?compact=0")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      ws: null,
      launchCode: null,
      service: null,
    });
    expect(parseAppBootstrapConfig("?compact=false")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      ws: null,
      launchCode: null,
      service: null,
    });
  });

  it("requires service provider metadata", () => {
    const encodedService = encodeBase64Url({
      id: "notebook",
      options: {
        apiUrl: "https://example.test/ogcapi",
      },
    });

    expect(parseAppBootstrapConfig(`?service=${encodedService}`)).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      ws: null,
      launchCode: null,
      service: null,
    });
  });

  it("parses websocket URLs", () => {
    expect(parseAppBootstrapConfig("?ws=ws://127.0.0.1:8743/ws")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      ws: "ws://127.0.0.1:8743/ws",
      launchCode: null,
      service: null,
    });
  });

  it("parses a Cuiman one-shot launch code without a service config", () => {
    expect(parseAppBootstrapConfig("?launch=opaque-code")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      ws: null,
      launchCode: "opaque-code",
      service: null,
    });
  });
});
