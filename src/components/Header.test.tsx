import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";
import { DEFAULT_APP_BRANDING } from "@/config/bootstrap";

vi.mock("@/store/hooks", () => ({
  useLoadService: () => ({ isLoading: false }),
}));
vi.mock("@/store/actions", () => ({ openDialog: vi.fn() }));

describe.skipIf(typeof document === "undefined")("Header branding", () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("renders built-in title and emoji", async () => {
    await act(async () =>
      root.render(
        <MantineProvider>
          <Header />
        </MantineProvider>,
      ),
    );
    expect(container.textContent).toContain("Eozilla");
    expect(container.textContent).toContain("🦖");
    expect(container.querySelector("img")).toBeNull();
  });

  it("renders an explicit header image and title as text", async () => {
    await act(async () =>
      root.render(
        <MantineProvider>
          <Header
            branding={{
              ...DEFAULT_APP_BRANDING,
              title: "<b>Sen4CAP</b>",
              icon: { url: "https://example.test/logo.svg" },
            }}
          />
        </MantineProvider>,
      ),
    );
    expect(container.textContent).toContain("<b>Sen4CAP</b>");
    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelector("img")?.src).toBe(
      "https://example.test/logo.svg",
    );
    expect(container.textContent).not.toContain("🦖");
  });
});
