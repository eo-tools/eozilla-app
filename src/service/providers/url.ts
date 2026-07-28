import type { ServiceOptions, ServiceOptionsSchema } from "@/service";

export type AuthType =
  | "none"
  | "basic"
  | "token"
  | "login"
  | "oauth2"
  | "api-key";

/** The only OAuth2 grant supported by this browser client. */
export type OAuth2GrantType = "authorization_code";
export type OAuth2Protocol = "oauth2" | "oidc";

export interface UrlServiceOptions extends ServiceOptions {
  apiUrl: string;
  authType: AuthType;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  /** @deprecated Use oauth2GrantType for OAuth2. */
  grantType?: string;
  refreshToken?: string;
  token?: string;
  useBearer?: boolean;
  tokenHeader?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  authorizationServerUrl?: string;
  oauth2Protocol?: OAuth2Protocol;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  oauth2GrantType?: OAuth2GrantType;
  oauth2Scopes?: string;
  accessToken?: string;
  accessTokenHeader?: string;
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
    description: "Choose how requests to the service are authorized.",
    default: "none",
    enum: ["none", "token", "login", "oauth2"],
  },

  // Reserved for a proprietary login flow, which is not implemented yet.
  username: {
    type: "string",
    title: "Username",
    nullable: true,
    "x-ui-hidden": true,
  },
  password: {
    type: "string",
    title: "Password",
    nullable: true,
    format: "password",
    "x-ui-hidden": true,
  },

  // Kept for legacy proprietary-login configurations and reused by OAuth2.
  clientId: {
    type: "string",
    title: "Client ID",
    description:
      "The public browser client registered with the authorization server.",
    nullable: true,
    "x-ui-visible": "authType === 'login' || authType === 'oauth2'",
  },
  clientSecret: {
    type: "string",
    title: "Client secret",
    nullable: true,
    format: "password",
    "x-ui-hidden": true,
  },
  grantType: {
    type: "string",
    title: "Grant type",
    default: "authorization_code",
    enum: [
      "authorization_code",
      "implicit",
      "password",
      "client_credentials",
      "refresh_token",
    ],
    "x-ui-hidden": true,
  },

  // For type "login", token refresh phase — set after a successful login if the server
  // returned a refresh token; presence of this field activates automatic token refresh on 401
  refreshToken: {
    type: "string",
    title: "Refresh token",
    nullable: true,
    format: "password",
    "x-ui-hidden": true,
  },

  // For type "token" or "login"
  token: {
    type: "string",
    title: "Access token",
    description: "The token sent with each request to the service.",
    nullable: true,
    format: "password",
    "x-ui-hidden": true,
  },

  // For type "token": custom header or Bearer
  useBearer: {
    type: "boolean",
    title: "Use Authorization: Bearer header",
    description:
      "Turn this off only when the service requires a custom header.",
    default: true,
    "x-ui-visible": "authType === 'token'",
  },
  tokenHeader: {
    type: "string",
    title: "Name of the token header",
    default: "X-Auth-Token",
    "x-ui-hidden": true,
  },

  // For type "api-key"
  apiKey: {
    type: "string",
    title: "API key",
    nullable: true,
    format: "password",
    "x-ui-hidden": true,
  },
  apiKeyHeader: {
    type: "string",
    title: "Name of the API key header",
    default: "X-API-Key",
    nullable: true,
    "x-ui-hidden": true,
  },
  authorizationServerUrl: {
    type: "string",
    title: "Authorization server URL",
    description: "The OIDC issuer URL used to discover its endpoints.",
    nullable: true,
    format: "uri",
    "x-ui-visible":
      "(authType === 'login' || authType === 'oauth2') && oauth2Protocol === 'oidc'",
  },
  oauth2Protocol: {
    type: "string",
    title: "Authorization protocol",
    default: "oidc",
    enum: ["oauth2", "oidc"],
    "x-ui-visible": "authType === 'login' || authType === 'oauth2'",
  },
  authorizationEndpoint: {
    type: "string",
    title: "Authorization endpoint",
    description: "The OAuth2 endpoint that starts the authorization redirect.",
    nullable: true,
    format: "uri",
    "x-ui-visible":
      "(authType === 'login' || authType === 'oauth2') && oauth2Protocol === 'oauth2'",
  },
  tokenEndpoint: {
    type: "string",
    title: "Token endpoint",
    description:
      "The OAuth2 endpoint that exchanges an authorization code for tokens.",
    nullable: true,
    format: "uri",
    "x-ui-visible":
      "(authType === 'login' || authType === 'oauth2') && oauth2Protocol === 'oauth2'",
  },
  oauth2Scopes: {
    type: "string",
    title: "OAuth2 scopes",
    description:
      "Space-separated scopes requested from the authorization server.",
    nullable: true,
    "x-ui-visible": "authType === 'login' || authType === 'oauth2'",
  },
  oauth2GrantType: {
    type: "string",
    title: "OAuth2 grant type",
    default: "authorization_code",
    enum: ["authorization_code"],
    "x-ui-hidden": true,
  },
  accessToken: {
    type: "string",
    title: "Access token",
    description: "The token sent with each request to the service.",
    nullable: true,
    format: "password",
    "x-ui-visible": "authType === 'token'",
  },
  accessTokenHeader: {
    type: "string",
    title: "Access token header",
    default: "X-Auth-Token",
    "x-ui-visible": "authType === 'token' && !useBearer",
  },
};
