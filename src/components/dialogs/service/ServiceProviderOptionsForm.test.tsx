import { MantineProvider } from "@mantine/core";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ServiceOptions, ServiceProvider } from "@/service";
import { URL_SERVICE_OPTIONS_SCHEMA } from "@/service/providers/url";
import { ServiceProviderOptionsForm } from "./ServiceProviderOptionsForm";

describe("ServiceProviderOptionsForm authentication UI", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      location: {
        origin: "https://eozilla.example.org",
        pathname: "/app/",
      },
    });
  });

  it("shows a compact authentication choice and public-service guidance", () => {
    const markup = renderForm(createProvider("none"));

    expect(markup).toContain("Public");
    expect(markup).toContain("Access token");
    expect(markup).toContain("OIDC sign-in");
    expect(markup).toContain("No credentials will be sent");
    expect(markup).not.toContain("Issuer URL");
  });

  it("shows only the token settings for access-token authentication", () => {
    const markup = renderForm(createProvider("token"));

    expect(markup).toContain("Paste access token");
    expect(markup).toContain("Send as a Bearer token");
    expect(markup).not.toContain("Issuer URL");
  });

  it("explains the OIDC redirect and hides advanced settings initially", () => {
    const markup = renderForm(createProvider("oidc"));

    expect(markup).toContain("Issuer URL");
    expect(markup).toContain("Client ID");
    expect(markup).toContain("Registered redirect URI");
    expect(markup).toContain("https://eozilla.example.org/app/");
    expect(markup).toContain("Continue to sign in");
    expect(markup).toContain("never asks for your password or a client secret");
    expect(markup).not.toContain("Space-separated permissions");
  });
});

function createProvider(
  authType: "none" | "token" | "oidc",
): ServiceProvider<ServiceOptions> {
  return {
    id: "custom",
    meta: { type: "custom", title: "Custom Service" },
    optionsSchema: {
      ...URL_SERVICE_OPTIONS_SCHEMA,
      authType: {
        type: "string",
        title: "Authentication Type",
        enum: ["none", "token", "oidc"],
        default: authType,
      },
    },
    signIn: vi.fn(),
    signOut: vi.fn(),
    createService: vi.fn(),
  };
}

function renderForm(provider: ServiceProvider<ServiceOptions>) {
  return renderToStaticMarkup(
    <MantineProvider>
      <ServiceProviderOptionsForm
        provider={provider}
        onBack={vi.fn()}
        onSubmit={vi.fn()}
      />
    </MantineProvider>,
  );
}
