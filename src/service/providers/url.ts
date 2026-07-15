import type { ServiceOptions, ServiceOptionsSchema } from "@/service";

export interface UrlServiceOptions extends ServiceOptions {
  apiUrl: string;
  authType: "none" | "token" | "oidc";
  token?: string;
  useBearer?: boolean;
  tokenHeader?: string;
  issuerUrl?: string;
  clientId?: string;
  scopes?: string;
  audience?: string;
}

export type UrlServiceOptionsSchema = ServiceOptionsSchema<UrlServiceOptions>;

export const URL_SERVICE_OPTIONS_SCHEMA: UrlServiceOptionsSchema = {
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

  // For type "token"
  token: {
    type: "string",
    title: "Access token",
    nullable: true,
    format: "password",
  },

  // For type "token": custom header or Bearer
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

  // For type "oidc". The redirect URI is the current application URL.
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
};
