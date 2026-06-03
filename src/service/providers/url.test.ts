import { describe, expect, it } from "vitest";
import { URL_SERVICE_OPTIONS_SCHEMA } from "./url";

describe("URL service options schema", () => {
  it("describes the expected configuration fields", () => {
    expect(URL_SERVICE_OPTIONS_SCHEMA).toEqual({
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
    });
  });
});
