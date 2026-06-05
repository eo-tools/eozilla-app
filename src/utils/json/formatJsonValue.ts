export function formatJsonValue(value: unknown): string {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return stringifyJsonValue(parsed);
    } catch {
      return value;
    }
  }

  return stringifyJsonValue(value);
}

function stringifyJsonValue(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}
