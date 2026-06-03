import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AssertionError,
  assert,
  createId,
  findById,
  getErrorMessage,
  isBoolean,
  isFunction,
  isNumber,
  isObject,
  isPopup,
  isString,
  omitKeys,
} from "./common";

describe("common utilities", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { opener: null });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("checks primitive and object types", () => {
    expect(isBoolean(true)).toBe(true);
    expect(isNumber(1)).toBe(true);
    expect(isString("x")).toBe(true);
    expect(isFunction(() => undefined)).toBe(true);
    expect(isObject({})).toBe(true);

    expect(isBoolean("true")).toBe(false);
    expect(isNumber("1")).toBe(false);
    expect(isString(1)).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isObject(null)).toBe(false);
  });

  it("detects a normal window as non-popup", () => {
    expect(isPopup()).toBe(false);
  });

  it("detects a popup window when an opener exists", () => {
    const popupWindow = globalThis.window as { opener: unknown };
    popupWindow.opener = {};

    expect(isPopup()).toBe(true);
  });

  it("creates a predictable id when time and randomness are stubbed", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.spyOn(Date, "now").mockReturnValue(0);

    expect(createId()).toBe("i0");
  });

  it("omits keys without mutating the source object", () => {
    const source = { id: "1", name: "Test", extra: true };

    expect(omitKeys(source, ["extra"])).toEqual({ id: "1", name: "Test" });
    expect(source).toEqual({ id: "1", name: "Test", extra: true });
  });

  it("finds entries by id and supports custom id keys", () => {
    const items = [
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ];

    expect(findById(items, "b")).toEqual({ id: "b", title: "B" });
    expect(findById(items, "x")).toBeUndefined();
    expect(findById([{ key: "k" }], "k", "key")).toEqual({ key: "k" });
  });

  it("asserts conditions and exposes the error type", () => {
    expect(() => assert(true)).not.toThrow();

    expect(() => assert(false, () => "boom")).toThrow(AssertionError);
    expect(() => assert(false, "boom")).toThrowError("boom");
  });

  it("extracts useful error messages", () => {
    expect(getErrorMessage(new Error("broken"))).toBe("broken");
    expect(getErrorMessage({ message: "nope" })).toBe("nope");
    expect(getErrorMessage({ toString: () => "custom" })).toBe("custom");
    expect(getErrorMessage(42)).toBe("42");
  });
});
