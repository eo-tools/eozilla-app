import { describe, expect, it } from "vitest";

import {
  getCuimanModeSearch,
  getCuimanWebSocketUrl,
  parseAppBootstrapConfig,
} from "./bootstrap";

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
      cuiman: false,
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
      cuiman: false,
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
      cuiman: false,
      launchCode: null,
      ws: null,
    });
    expect(parseAppBootstrapConfig("?compact=false")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      cuiman: false,
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
      cuiman: false,
      launchCode: "opaque-code",
      ws: null,
    });
  });

  it("parses the persistent Cuiman mode marker", () => {
    expect(parseAppBootstrapConfig("?cuiman=1")).toEqual({
      compact: false,
      debug: false,
      proxy: null,
      scheme: undefined,
      cuiman: true,
      launchCode: null,
      ws: null,
    });
  });

  it("derives a same-origin WebSocket URL for local and proxied apps", () => {
    expect(getCuimanWebSocketUrl("http://127.0.0.1:8765/index.html")).toBe(
      "ws://127.0.0.1:8765/ws",
    );
    expect(
      getCuimanWebSocketUrl(
        "https://hub.example/user/test/proxy/8765/index.html?cuiman=1",
      ),
    ).toBe("wss://hub.example/user/test/proxy/8765/ws");
  });

  it("replaces launch-only bootstrap parameters with the Cuiman mode marker", () => {
    expect(
      getCuimanModeSearch(
        "?compact=1&launch=opaque-code&ws=ws%3A%2F%2Flocalhost%2Fws&proxy=https%3A%2F%2Fhub.example%2Fproxy%2F&_t=123",
      ),
    ).toBe("compact=1&cuiman=1");
  });
});
