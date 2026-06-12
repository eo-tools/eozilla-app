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
      parseAppBootstrapConfig(`?compact=1&scheme=dark&config=${encodedConfig}`),
    ).toEqual({
      compact: true,
      scheme: "dark",
      config: {
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

    expect(
      parseAppBootstrapConfig("?compact&scheme=dark&config=not-json"),
    ).toEqual({
      compact: true,
      scheme: "dark",
      config: null,
    });

    warn.mockRestore();
  });

  it("ignores invalid color scheme values", () => {
    expect(parseAppBootstrapConfig("?scheme=auto")).toEqual({
      compact: false,
      scheme: undefined,
      config: null,
    });
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
      scheme: undefined,
      config: null,
    });
  });
});
