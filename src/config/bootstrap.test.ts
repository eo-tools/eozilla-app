import { describe, expect, it, vi } from "vitest";

import { parseAppBootstrapConfig } from "./bootstrap";

function encodeBase64Url(value: unknown): string {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

describe("parseAppBootstrapConfig", () => {
  it("parses compact mode and the serialized app config", () => {
    const encodedConfig = encodeBase64Url({
      serviceProviderId: "notebook",
      serviceProviderMeta: {
        type: "system",
        title: "Notebook Service",
        description: "Configured by Jupyter",
        hidden: true,
      },
      serviceProviderOptions: {
        apiUrl: "https://example.test/ogcapi",
        authType: "none",
        ignoredObject: { value: "not supported" },
      },
    });

    expect(
      parseAppBootstrapConfig(`?compact=1&config=${encodedConfig}`),
    ).toEqual({
      compact: true,
      serializedConfig: {
        serviceProviderId: "notebook",
        serviceProviderMeta: {
          type: "system",
          title: "Notebook Service",
          description: "Configured by Jupyter",
          disabled: undefined,
          hidden: true,
        },
        serviceProviderOptions: {
          apiUrl: "https://example.test/ogcapi",
          authType: "none",
        },
      },
    });
  });

  it("ignores invalid serialized config values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(parseAppBootstrapConfig("?compact&config=not-json")).toEqual({
      compact: true,
      serializedConfig: null,
    });

    warn.mockRestore();
  });

  it("requires service provider metadata", () => {
    const encodedConfig = encodeBase64Url({
      serviceProviderId: "notebook",
      serviceProviderOptions: {
        apiUrl: "https://example.test/ogcapi",
      },
    });

    expect(parseAppBootstrapConfig(`?config=${encodedConfig}`)).toEqual({
      compact: false,
      serializedConfig: null,
    });
  });
});
