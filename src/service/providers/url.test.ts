import { describe, expect, it } from "vitest";

import { URL_SERVICE_OPTIONS_SCHEMA } from "./url";

describe("URL service options schema", () => {
  it("uses the Cuiman authentication option names", () => {
    expect(URL_SERVICE_OPTIONS_SCHEMA).toMatchObject({
      authType: {
        default: "none",
        enum: ["none", "basic", "token", "login", "oauth2", "api-key"],
      },
      accessToken: {
        format: "password",
        "x-ui-visible": "authType === 'token'",
        "x-ui-required": "authType === 'token'",
      },
      useBearer: {
        default: true,
        "x-ui-visible": "authType === 'token' || authType === 'login'",
        "x-ui-required": "authType === 'token' || authType === 'login'",
      },
      accessTokenHeader: {
        default: "X-Auth-Token",
        "x-ui-visible":
          "(authType === 'token' || authType === 'login') && !useBearer",
        "x-ui-required":
          "(authType === 'token' || authType === 'login') && !useBearer",
      },
      loginUrl: {
        format: "uri",
        "x-ui-visible": "authType === 'login'",
        "x-ui-required": "authType === 'login'",
      },
      username: {
        "x-ui-visible": "authType === 'basic' || authType === 'login'",
        "x-ui-required": "authType === 'basic' || authType === 'login'",
      },
      password: {
        format: "password",
        "x-ui-visible": "authType === 'basic' || authType === 'login'",
        "x-ui-required": "authType === 'basic' || authType === 'login'",
      },
      apiKey: {
        format: "password",
        "x-ui-visible": "authType === 'api-key'",
        "x-ui-required": "authType === 'api-key'",
      },
      apiKeyHeader: {
        default: "X-API-Key",
        "x-ui-visible": "authType === 'api-key'",
        "x-ui-required": "authType === 'api-key'",
      },
      authorizationServerUrl: {
        format: "uri",
        "x-ui-visible": "authType === 'oauth2' && oauth2Protocol === 'oidc'",
        "x-ui-required": "authType === 'oauth2' && oauth2Protocol === 'oidc'",
      },
      oauth2Protocol: {
        default: "oidc",
        enum: ["oauth2", "oidc"],
        "x-ui-visible": "authType === 'oauth2'",
        "x-ui-required": "authType === 'oauth2'",
      },
      authorizationEndpoint: {
        "x-ui-visible": "authType === 'oauth2' && oauth2Protocol === 'oauth2'",
        "x-ui-required": "authType === 'oauth2' && oauth2Protocol === 'oauth2'",
      },
      tokenEndpoint: {
        "x-ui-visible": "authType === 'oauth2' && oauth2Protocol === 'oauth2'",
        "x-ui-required": "authType === 'oauth2' && oauth2Protocol === 'oauth2'",
      },
      oauth2Scopes: {
        nullable: true,
        "x-ui-visible": "authType === 'oauth2'",
      },
      clientId: {
        "x-ui-visible": "authType === 'oauth2'",
        "x-ui-required": "authType === 'oauth2'",
      },
      tokenUrl: { format: "uri", "x-ui-hidden": true },
      grantType: {
        enum: ["password", "client_credentials"],
        "x-ui-hidden": true,
      },
      clientSecret: { format: "password", "x-ui-hidden": true },
      refreshToken: { format: "password", "x-ui-hidden": true },
    });
  });
});
