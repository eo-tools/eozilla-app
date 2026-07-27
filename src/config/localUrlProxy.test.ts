import { afterEach, describe, expect, it, vi } from "vitest";

import { configureLocalUrlProxy, resolveAppUrl } from "./localUrlProxy";

describe("local URL proxy", () => {
  afterEach(() => {
    configureLocalUrlProxy(null);
    vi.restoreAllMocks();
  });

  it.each([
    ["localhost", "http://localhost:8080/process/"],
    ["localhost subdomain", "http://tools.localhost:8080/process/"],
    ["IPv4 loopback", "http://127.23.45.67:8080/process/"],
    ["IPv6 loopback", "http://[::1]:8080/process/"],
  ])("proxies %s URLs", (_label, sourceUrl) => {
    configureLocalUrlProxy("https://hub.example/user/test/proxy/");

    expect(resolveAppUrl(sourceUrl)).toBe(
      "https://hub.example/user/test/proxy/8080/process/",
    );
  });

  it("preserves paths, queries, and fragments", () => {
    configureLocalUrlProxy("https://hub.example/user/test/proxy/");

    expect(resolveAppUrl("http://localhost:8080/api/?x=1#result")).toBe(
      "https://hub.example/user/test/proxy/8080/api/?x=1#result",
    );
  });

  it("uses protocol default ports", () => {
    configureLocalUrlProxy("https://hub.example/user/test/proxy/");

    expect(resolveAppUrl("http://localhost/health")).toBe(
      "https://hub.example/user/test/proxy/80/health",
    );
    expect(resolveAppUrl("https://localhost/health")).toBe(
      "https://hub.example/user/test/proxy/443/health",
    );
  });

  it("uses the matching WebSocket scheme", () => {
    configureLocalUrlProxy("https://hub.example/user/test/proxy/");

    expect(resolveAppUrl("ws://localhost:7070/events")).toBe(
      "wss://hub.example/user/test/proxy/7070/events",
    );
  });

  it("leaves external and invalid URLs unchanged", () => {
    configureLocalUrlProxy("https://hub.example/user/test/proxy/");

    expect(resolveAppUrl("https://api.example.test/process/")).toBe(
      "https://api.example.test/process/",
    );
    expect(resolveAppUrl("not a URL")).toBe("not a URL");
  });

  it("leaves URLs unchanged when the proxy is disabled", () => {
    expect(resolveAppUrl("http://localhost:8080/process/")).toBe(
      "http://localhost:8080/process/",
    );
  });

  it("warns and disables invalid proxy bases", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    configureLocalUrlProxy("file:///tmp/proxy/");

    expect(resolveAppUrl("http://localhost:8080/process/")).toBe(
      "http://localhost:8080/process/",
    );
    expect(warn).toHaveBeenCalledOnce();
  });
});
