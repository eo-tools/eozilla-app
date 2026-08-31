import { describe, expect, it } from "vitest";

import type { ServiceProvider } from "@/service";
import { URL_SERVICE_OPTIONS_SCHEMA } from "@/service/providers/url";
import { normalizeServiceProviderOptions } from "./serviceProviderOptions";

const provider = {
  optionsSchema: URL_SERVICE_OPTIONS_SCHEMA,
} as ServiceProvider;

describe("normalizeServiceProviderOptions", () => {
  it("submits only the active authentication fields", () => {
    expect(
      normalizeServiceProviderOptions(provider, {
        authType: "oauth2",
        oauth2Protocol: "oidc",
        clientId: "eozilla-app",
        authorizationServerUrl: "https://auth.example",
        authorizationEndpoint: "",
        tokenEndpoint: "",
      }),
    ).toMatchObject({
      authType: "oauth2",
      oauth2Protocol: "oidc",
      clientId: "eozilla-app",
      authorizationServerUrl: "https://auth.example",
    });
  });

  it("requires only the fields for the selected authentication mode", () => {
    expect(() =>
      normalizeServiceProviderOptions(provider, {
        authType: "token",
        accessToken: "",
      }),
    ).toThrow("Please provide a value for Access token.");

    expect(() =>
      normalizeServiceProviderOptions(provider, {
        authType: "api-key",
        apiKey: "",
      }),
    ).toThrow("Please provide a value for API key.");

    expect(() =>
      normalizeServiceProviderOptions(provider, {
        authType: "oauth2",
        oauth2Protocol: "oauth2",
        clientId: "eozilla-app",
        authorizationEndpoint: "",
        tokenEndpoint: "",
      }),
    ).toThrow("Please provide a value for Authorization endpoint.");

    expect(() =>
      normalizeServiceProviderOptions(provider, {
        authType: "login",
        loginUrl: "https://auth.example/login",
        username: "user",
        password: "",
      }),
    ).toThrow("Please provide a value for Password.");
  });
});
