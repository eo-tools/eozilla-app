export type SyntaxTokenType =
  | "plain"
  | "key"
  | "string"
  | "number"
  | "boolean"
  | "null"
  | "punctuation";

export interface SyntaxToken {
  type: SyntaxTokenType;
  value: string;
}

const jsonTokenPattern =
  /"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false)\b|\bnull\b|[{}:,]|\[|\]|\s+|./g;

export function tokenizeJsonCode(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];

  for (const match of code.matchAll(jsonTokenPattern)) {
    const value = match[0];
    tokens.push({ type: getJsonTokenType(code, value, match.index), value });
  }

  return tokens;
}

function getJsonTokenType(
  code: string,
  value: string,
  startIndex: number,
): SyntaxTokenType {
  if (/^\s+$/.test(value)) {
    return "plain";
  }

  if (/^"(?:\\.|[^"\\])*"$/.test(value)) {
    return isJsonObjectKey(code, startIndex + value.length) ? "key" : "string";
  }

  if (/^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)) {
    return "number";
  }

  if (value === "true" || value === "false") {
    return "boolean";
  }

  if (value === "null") {
    return "null";
  }

  if ("{}[]:,".includes(value)) {
    return "punctuation";
  }

  return "plain";
}

function isJsonObjectKey(code: string, index: number) {
  let currentIndex = index;

  while (/\s/.test(code[currentIndex] ?? "")) {
    currentIndex += 1;
  }

  return code[currentIndex] === ":";
}
