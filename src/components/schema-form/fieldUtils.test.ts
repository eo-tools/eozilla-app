import { describe, expect, it } from "vitest";

import { getFieldLabel } from "./fieldUtils";

describe("getFieldLabel", () => {
  it("skips property prefix 'x-' if title is generated", () => {
    // generated title title
    expect(
      getFieldLabel({ name: "x-cid", schema: { type: "string" } }),
    ).toEqual("Cid");

    // explicit title
    expect(
      getFieldLabel({
        name: "cid",
        schema: { type: "string", title: "X-CID" },
      }),
    ).toEqual("X-CID");
  });
});
