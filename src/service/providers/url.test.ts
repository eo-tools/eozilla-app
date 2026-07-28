import { describe, expect, it } from "vitest";

import { URL_SERVICE_OPTIONS_SCHEMA } from "./url";

describe("URL service options schema", () => {
  it("uses the new OAuth2 configuration while retaining hidden legacy fields", () => {
    expect(URL_SERVICE_OPTIONS_SCHEMA).toMatchObject({
      authType: {
        default: "none",
        enum: ["none", "token", "login", "oauth2"],
      },
      accessToken: {
        format: "password",
        "x-ui-visible": "authType === 'token'",
      },
      useBearer: {
        default: true,
        "x-ui-visible": "authType === 'token'",
      },
      accessTokenHeader: {
        default: "X-Auth-Token",
        "x-ui-visible": "authType === 'token' && !useBearer",
      },
      authorizationServerUrl: {
        format: "uri",
        "x-ui-visible": "authType === 'login' || authType === 'oauth2'",
      },
      oauth2Scopes: {
        default: "openid profile email",
        "x-ui-visible": "authType === 'oauth2'",
      },
      clientId: {
        "x-ui-visible": "authType === 'login' || authType === 'oauth2'",
      },
      oauth2GrantType: {
        default: "authorization_code",
        enum: ["authorization_code"],
        "x-ui-hidden": true,
      },
      token: { "x-ui-hidden": true },
      tokenHeader: { "x-ui-hidden": true },
      grantType: { "x-ui-hidden": true },
    });
  });
});
