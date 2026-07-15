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
      authType: {
        type: "string",
        title: "Authentication Type",
        default: "none",
        enum: ["none", "token", "oidc"],
      },

      token: {
        type: "string",
        title: "Access token",
        nullable: true,
        format: "password",
      },

      useBearer: {
        type: "boolean",
        title: "Use Authorization: Bearer header",
        nullable: true,
      },
      tokenHeader: {
        type: "string",
        title: "Name of the token header",
        nullable: true,
      },

      issuerUrl: {
        type: "string",
        title: "OIDC issuer URL",
        nullable: true,
        format: "uri",
      },
      clientId: {
        type: "string",
        title: "OIDC client ID",
        nullable: true,
      },
      scopes: {
        type: "string",
        title: "OIDC scopes",
        default: "openid profile email",
      },
      audience: {
        type: "string",
        title: "OIDC audience",
        nullable: true,
      },
    });
  });
});
