export type Optional<T> = T | null | undefined;

export function isPopup() {
  return !!(window.opener && window.opener !== window);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isFunction(
  value: unknown,
): value is (...args: unknown[]) => unknown {
  return typeof value === "function";
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isEmptyObject(
  obj: Record<string, unknown>,
): obj is Record<string, never> {
  for (const _ in obj) {
    return false;
  }
  return true;
}

export function createId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function omitKeys<T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const clone = { ...obj };
  for (const key of keys) {
    delete clone[key];
  }
  return clone;
}

export function findById<T extends object>(
  array: T[] | undefined,
  id: string | undefined,
  idKey: string = "id",
): T | undefined {
  return array && id
    ? array.find((v) => (v as unknown as Record<string, unknown>)[idKey] === id)
    : undefined;
}

export class AssertionError extends Error {}

export function assert(
  condition: boolean | (() => boolean),
  message: string | (() => string) = "assertion failed",
): void {
  if (!(typeof condition === "function" ? condition() : condition)) {
    throw new AssertionError(
      typeof message === "function" ? message() : message,
    );
  }
}

export function getErrorMessage(error: unknown): string {
  let message: unknown = error;
  if (isObject(error)) {
    if ("message" in error && isString(error.message)) {
      message = error.message;
    } else if ("toString" in error && isFunction(error.toString)) {
      message = error.toString();
    }
  }
  return String(message);
}
