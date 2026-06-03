import { describe, expect, it } from "vitest";
import {
  isJsonArray,
  isJsonObject,
  isJsonPrimitive,
  isJsonValue,
} from "./value";

describe("json value guards", () => {
  it("detects json primitives", () => {
    expect(isJsonPrimitive(null)).toBe(true);
    expect(isJsonPrimitive(true)).toBe(true);
    expect(isJsonPrimitive(1)).toBe(true);
    expect(isJsonPrimitive("x")).toBe(true);
    expect(isJsonPrimitive({})).toBe(false);
    expect(isJsonPrimitive([])).toBe(false);
  });

  it("detects json arrays recursively", () => {
    expect(isJsonArray([null, true, 1, "x", []])).toBe(true);
    expect(isJsonArray([() => undefined])).toBe(false);
  });

  it("detects json objects recursively", () => {
    expect(isJsonObject({ a: null, b: { c: [] } })).toBe(true);
    expect(isJsonObject({ a: () => undefined })).toBe(false);
    expect(isJsonObject([])).toBe(false);
  });

  it("detects any json value", () => {
    expect(isJsonValue({ a: 1 })).toBe(true);
    expect(isJsonValue([1, 2, 3])).toBe(true);
    expect(isJsonValue(new Date())).toBe(false);
  });
});
