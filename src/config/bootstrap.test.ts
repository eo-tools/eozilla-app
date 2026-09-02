import { describe, expect, it } from "vitest";

import { parseAppBootstrapConfig } from "./bootstrap";

describe("parseAppBootstrapConfig", () => {
  it("parses public UI and Jupyter Server Proxy options", () => {
    expect(
      parseAppBootstrapConfig(
        `?compact=1&debug=1&proxy=${encodeURIComponent(
          "https://hub.example/user/test/proxy/",
        )}&scheme=dark&ws=ws://127.0.0.1:8743/ws`,
      ),
    ).toEqual({
      compact: true,
      debug: true,
      proxy: "https://hub.example/user/test/proxy/",
      scheme: "dark",
      launchCode: null,
      ws: "ws://127.0.0.1:8743/ws",
    });
  });

  it("ignores invalid color scheme values", () => {
    expect(parseAppBootstrapConfig("?scheme=auto")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      launchCode: null,
      ws: null,
    });
  });

  it("parses explicit compact mode false values", () => {
    expect(parseAppBootstrapConfig("?compact=0")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      launchCode: null,
      ws: null,
    });
    expect(parseAppBootstrapConfig("?compact=false")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      launchCode: null,
      ws: null,
    });
  });

  it("parses a Cuiman one-shot launch code", () => {
    expect(parseAppBootstrapConfig("?launch=opaque-code")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      launchCode: "opaque-code",
      ws: null,
    });
  });
});
