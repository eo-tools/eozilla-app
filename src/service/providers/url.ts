import type { ServiceOptions, ServiceOptionsSchema } from "@/service";

export interface UrlServiceOptions extends ServiceOptions {
  apiUrl: string;
  authType: "none" | "basic" | "login" | "token";
  authUrl: string;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  grantType?: string;
  refreshToken?: string;
  token?: string;
  useBearer?: boolean;
  tokenHeader?: string;
  apiKey?: string;
  apiKeyHeader?: string;
}

export type UrlServiceOptionsSchema = ServiceOptionsSchema<UrlServiceOptions>;

export const URL_SERVICE_OPTIONS_SCHEMA: UrlServiceOptionsSchema = {
  apiUrl: {
    type: "string",
    title: "Service API URL",
    default: "http://localhost:8008",
    format: "uri",
  },

  // Authentication URL, usually an endpoint ending with "/auth/login".
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

  // For type "basic" or "login" (username/password -> token)
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

  // For type "login", initial password grant
  // (OAuth2 Resource Owner Password Credentials)
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

  // For type "login", token refresh phase — set after a successful login if the server
  // returned a refresh token; presence of this field activates automatic token refresh on 401
  refreshToken: {
    type: "string",
    title: "Refresh token",
    nullable: true,
    format: "password",
  },

  // For type "token" or "login"
  token: {
    type: "string",
    title: "Access token",
    nullable: true,
    format: "password",
  },

  // For type "token": custom header or Bearer
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

  // For type "api-key"
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
};
