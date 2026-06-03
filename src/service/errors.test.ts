import { describe, expect, it } from "vitest";
import { ServiceError } from "./errors";

describe("ServiceError", () => {
  it("exposes the api error and derives the message", () => {
    const apiError = {
      type: "Not Found",
      title: "Missing process",
      status: 404,
    };

    const error = new ServiceError(apiError);

    expect(error.message).toBe("Missing process");
    expect(error.apiError).toBe(apiError);
  });
});
