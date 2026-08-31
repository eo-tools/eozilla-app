import type { ServiceOptions, ServiceOptionsSchema } from "@/service";

export type AuthType =
  | "none"
  | "basic"
  | "token"
  | "login"
  | "oauth2"
  | "api-key";

export type OAuth2Protocol = "oauth2" | "oidc";

export interface UrlServiceOptions extends ServiceOptions {
  apiUrl: string;
  authType: AuthType;
  username?: string;
  password?: string;
  loginUrl?: string;
  tokenUrl?: string;
  grantType?: "password" | "client_credentials";
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  useBearer?: boolean;
  accessToken?: string;
  accessTokenHeader?: string;
  apiKey?: string;
  apiKeyHeader?: string;
  authorizationServerUrl?: string;
  oauth2Protocol?: OAuth2Protocol;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  oauth2Scopes?: string;
}

export type UrlServiceOptionsSchema = ServiceOptionsSchema<UrlServiceOptions>;

export const URL_SERVICE_OPTIONS_SCHEMA: UrlServiceOptionsSchema = {
  apiUrl: {
    type: "string",
    title: "Service API URL",
    default:
      import.meta.env.VITE_DEFAULT_SERVICE_API_URL || "http://localhost:8008",
    format: "uri",
  },

  authType: {
    type: "string",
    title: "Authentication Type",
    description: "Choose how requests to the service are authorized.",
    default: import.meta.env.VITE_DEFAULT_SERVICE_AUTH_TYPE || "none",
    enum: ["none", "basic", "token", "login", "oauth2", "api-key"],
  },

  username: {
    type: "string",
    title: "Username",
    "x-ui-visible": "authType === 'basic' || authType === 'login'",
    "x-ui-required": "authType === 'basic' || authType === 'login'",
  },
  password: {
    type: "string",
    title: "Password",
    format: "password",
    "x-ui-visible": "authType === 'basic' || authType === 'login'",
    "x-ui-required": "authType === 'basic' || authType === 'login'",
  },

  loginUrl: {
    type: "string",
    title: "Login URL",
    format: "uri",
    "x-ui-visible": "authType === 'login'",
    "x-ui-required": "authType === 'login'",
  },
  // These legacy Cuiman options are accepted in preconfigured providers. The
  // app's interactive OAuth2 flow uses Authorization Code + PKCE instead.
  tokenUrl: {
    type: "string",
    title: "OAuth2 token URL",
    nullable: true,
    format: "uri",
    "x-ui-hidden": true,
  },
  grantType: {
    type: "string",
    title: "OAuth2 grant type",
    nullable: true,
    enum: ["password", "client_credentials"],
    "x-ui-hidden": true,
  },

  clientId: {
    type: "string",
    title: "Client ID",
    description:
      "The public browser client registered with the authorization server.",
    default: import.meta.env.VITE_DEFAULT_SERVICE_CLIENT_ID || undefined,
    "x-ui-visible": "authType === 'oauth2'",
    "x-ui-required": "authType === 'oauth2'",
  },
  clientSecret: {
    type: "string",
    title: "Client secret",
    nullable: true,
    format: "password",
    "x-ui-hidden": true,
  },
  refreshToken: {
    type: "string",
    title: "Refresh token",
    nullable: true,
    format: "password",
    "x-ui-hidden": true,
  },

  // For type "token". Login and OAuth2 obtain their access tokens themselves.
  accessToken: {
    type: "string",
    title: "Access token",
    description: "The token sent with each request to the service.",
    format: "password",
    "x-ui-visible": "authType === 'token'",
    "x-ui-required": "authType === 'token'",
  },

  useBearer: {
    type: "boolean",
    title: "Use Authorization: Bearer header",
    description:
      "Turn this off only when the service requires a custom header.",
    default: true,
    "x-ui-visible": "authType === 'token' || authType === 'login'",
    "x-ui-required": "authType === 'token' || authType === 'login'",
  },
  accessTokenHeader: {
    type: "string",
    title: "Access token header",
    default: "X-Auth-Token",
    "x-ui-visible":
      "(authType === 'token' || authType === 'login') && !useBearer",
    "x-ui-required":
      "(authType === 'token' || authType === 'login') && !useBearer",
  },

  // For type "api-key"
  apiKey: {
    type: "string",
    title: "API key",
    format: "password",
    "x-ui-visible": "authType === 'api-key'",
    "x-ui-required": "authType === 'api-key'",
  },
  apiKeyHeader: {
    type: "string",
    title: "Name of the API key header",
    default: "X-API-Key",
    "x-ui-visible": "authType === 'api-key'",
    "x-ui-required": "authType === 'api-key'",
  },
  authorizationServerUrl: {
    type: "string",
    title: "Authorization server URL",
    description: "The OIDC issuer URL used to discover its endpoints.",
    default:
      import.meta.env.VITE_DEFAULT_SERVICE_AUTHORIZATION_SERVER_URL ||
      undefined,
    format: "uri",
    "x-ui-visible": "authType === 'oauth2' && oauth2Protocol === 'oidc'",
    "x-ui-required": "authType === 'oauth2' && oauth2Protocol === 'oidc'",
  },
  oauth2Protocol: {
    type: "string",
    title: "Authorization protocol",
    default: import.meta.env.VITE_DEFAULT_SERVICE_OAUTH2_PROTOCOL || "oidc",
    enum: ["oauth2", "oidc"],
    "x-ui-visible": "authType === 'oauth2'",
    "x-ui-required": "authType === 'oauth2'",
  },
  authorizationEndpoint: {
    type: "string",
    title: "Authorization endpoint",
    description: "The OAuth2 endpoint that starts the authorization redirect.",
    format: "uri",
    "x-ui-visible": "authType === 'oauth2' && oauth2Protocol === 'oauth2'",
    "x-ui-required": "authType === 'oauth2' && oauth2Protocol === 'oauth2'",
  },
  tokenEndpoint: {
    type: "string",
    title: "Token endpoint",
    description:
      "The OAuth2 endpoint that exchanges an authorization code for tokens.",
    format: "uri",
    "x-ui-visible": "authType === 'oauth2' && oauth2Protocol === 'oauth2'",
    "x-ui-required": "authType === 'oauth2' && oauth2Protocol === 'oauth2'",
  },
  oauth2Scopes: {
    type: "string",
    title: "OAuth2 scopes",
    description:
      "Space-separated scopes requested from the authorization server.",
    nullable: true,
    "x-ui-visible": "authType === 'oauth2'",
  },
};
