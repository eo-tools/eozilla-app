import { describe, expect, it } from "vitest";
import {
  isInlineValue,
  isLink,
  isQualifiedValue,
} from "./models";

describe("service model helpers", () => {
  it("detects link, qualified, and inline job results", () => {
    expect(isLink({ href: "https://example.com" })).toBe(true);
    expect(isQualifiedValue({ value: 1, mediaType: "application/json" })).toBe(
      true,
    );
    expect(isInlineValue({ foo: "bar" })).toBe(true);

    expect(isLink({ value: 1 })).toBe(false);
    expect(isQualifiedValue({ href: "https://example.com" })).toBe(false);
    expect(isInlineValue({ href: () => undefined } as never)).toBe(false);
  });
});
