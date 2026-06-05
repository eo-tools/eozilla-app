import { describe, expect, it } from "vitest";

import { tokenizeJsonCode } from "./tokenizeJsonCode";

describe("tokenizeJsonCode", () => {
  it("preserves the original JSON code text", () => {
    const code = JSON.stringify(
      {
        name: "Ada",
        count: -12.5e2,
        enabled: true,
        missing: null,
        items: ["first", "second"],
      },
      null,
      2,
    );

    const tokens = tokenizeJsonCode(code);

    expect(tokens.map((token) => token.value).join("")).toBe(code);
  });

  it("classifies JSON syntax tokens", () => {
    const code =
      '{ "name": "Ada", "count": -1250, "enabled": true, "missing": null, "items": [] }';

    const tokens = tokenizeJsonCode(code).filter(
      (token) => token.type !== "plain",
    );

    expect(tokens).toEqual([
      { type: "punctuation", value: "{" },
      { type: "key", value: '"name"' },
      { type: "punctuation", value: ":" },
      { type: "string", value: '"Ada"' },
      { type: "punctuation", value: "," },
      { type: "key", value: '"count"' },
      { type: "punctuation", value: ":" },
      { type: "number", value: "-1250" },
      { type: "punctuation", value: "," },
      { type: "key", value: '"enabled"' },
      { type: "punctuation", value: ":" },
      { type: "boolean", value: "true" },
      { type: "punctuation", value: "," },
      { type: "key", value: '"missing"' },
      { type: "punctuation", value: ":" },
      { type: "null", value: "null" },
      { type: "punctuation", value: "," },
      { type: "key", value: '"items"' },
      { type: "punctuation", value: ":" },
      { type: "punctuation", value: "[" },
      { type: "punctuation", value: "]" },
      { type: "punctuation", value: "}" },
    ]);
  });

  it("handles escaped characters inside strings", () => {
    const code = '{ "quote": "She said \\"hello\\"", "path": "C:\\\\tmp" }';

    const tokens = tokenizeJsonCode(code).filter(
      (token) => token.type === "key" || token.type === "string",
    );

    expect(tokens).toEqual([
      { type: "key", value: '"quote"' },
      { type: "string", value: '"She said \\"hello\\""' },
      { type: "key", value: '"path"' },
      { type: "string", value: '"C:\\\\tmp"' },
    ]);
  });
});
