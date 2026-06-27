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
        `?compact=1&debug=1&scheme=dark&service=${encodedService}`,
      ),
    ).toEqual({
      compact: true,
      debug: true,
      scheme: "dark",
      ws: null,
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
      scheme: "dark",
      ws: null,
      service: null,
    });

    warn.mockRestore();
  });

  it("ignores invalid color scheme values", () => {
    expect(parseAppBootstrapConfig("?scheme=auto")).toEqual({
      compact: false,
      debug: false,
      scheme: undefined,
      ws: null,
      service: null,
    });
  });

  it("parses explicit compact mode false values", () => {
    expect(parseAppBootstrapConfig("?compact=0")).toEqual({
      compact: false,
      debug: false,
      scheme: undefined,
      ws: null,
      service: null,
    });
    expect(parseAppBootstrapConfig("?compact=false")).toEqual({
      compact: false,
      debug: false,
      scheme: undefined,
      ws: null,
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
      scheme: undefined,
      ws: null,
      service: null,
    });
  });

  it("parses websocket URLs", () => {
    expect(parseAppBootstrapConfig("?ws=ws://127.0.0.1:8743/ws")).toEqual({
      compact: false,
      debug: false,
      scheme: undefined,
      ws: "ws://127.0.0.1:8743/ws",
      service: null,
    });
  });
});
