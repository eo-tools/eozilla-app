import type { ServiceOptions, ServiceOptionsSchema } from "@/service";

export interface UrlServiceOptions extends ServiceOptions {
  apiUrl: string;
  authType: "none" | "basic" | "login" | "token";
  authUrl: string;
}

export type UrlServiceOptionsSchema = ServiceOptionsSchema<UrlServiceOptions>;

export const URL_SERVICE_OPTIONS_SCHEMA: UrlServiceOptionsSchema = {
  apiUrl: {
    type: "string",
    title: "Service API URL",
    default: "http://localhost:8008",
  },
  authType: {
    type: "string",
    title: "Authentication Type",
    default: "none",
    enum: ["none", "basic", "login", "token"],
  },
  authUrl: {
    type: "string",
    title: "Authentication URL",
    nullable: true,
  },
};
