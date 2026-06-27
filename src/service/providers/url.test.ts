import { describe, expect, it } from "vitest";
import { URL_SERVICE_OPTIONS_SCHEMA } from "./url";

describe("URL service options schema", () => {
  it("describes the expected configuration fields", () => {
    expect(URL_SERVICE_OPTIONS_SCHEMA).toEqual({
      apiUrl: {
        type: "string",
        title: "Service API URL",
        default: "http://localhost:8008",
        format: "uri",
      },
      authUrl: {
        type: "string",
        title: "Authentication URL",
        nullable: true,
        format: "uri",
      },
      authType: {
        type: "string",
        title: "Authentication Type",
        default: "none",
        enum: ["none", "basic", "login", "token", "api-key"],
      },

      username: {
        type: "string",
        title: "Username",
        nullable: true,
      },
      password: {
        type: "string",
        title: "Password",
        nullable: true,
        format: "password",
      },

      clientId: {
        type: "string",
        title: "Client ID",
        nullable: true,
        format: "password",
      },
      clientSecret: {
        type: "string",
        title: "Client secret",
        nullable: true,
        format: "password",
      },
      grantType: {
        type: "string",
        title: "Grant type",
        nullable: true,
        enum: [
          "authorization_code",
          "implicit",
          "password",
          "client_credentials",
          "refresh_token",
        ],
      },

      refreshToken: {
        type: "string",
        title: "Refresh token",
        nullable: true,
        format: "password",
      },

      token: {
        type: "string",
        title: "Access token",
        nullable: true,
        format: "password",
      },

      useBearer: {
        type: "boolean",
        title: "Grant type",
        nullable: true,
      },
      tokenHeader: {
        type: "string",
        title: "Name of the token header",
        nullable: true,
      },

      apiKey: {
        type: "string",
        title: "API key",
        nullable: true,
        format: "password",
      },
      apiKeyHeader: {
        type: "string",
        title: "Name of the API key header",
        default: "X-API-Key",
        nullable: true,
      },
    });
  });
});
