import { describe, expect, it } from "vitest";

import type { ProcessDescription, ProcessRequest } from "@/service";
import {
  parseProcessRequestJson,
  stringifyProcessRequestJson,
} from "@/utils/processRequestFile";

describe("processRequestFile", () => {
  it("stringifies a process request as formatted JSON", () => {
    const request: ProcessRequest = {
      inputs: {
        scene: { id: "demo" },
      },
      response: "document",
    };

    expect(stringifyProcessRequestJson(request)).toBe(
      JSON.stringify(request, null, 2),
    );
  });

  it("parses a process request from JSON", () => {
    const processDescription = createProcessDescription();
    const request = {
      inputs: {
        scene: "demo",
      },
      subscriber: {
        successUri: "https://example.com/success",
      },
    };

    expect(
      parseProcessRequestJson(JSON.stringify(request), processDescription),
    ).toEqual(request);
  });

  it("rejects non-object JSON", () => {
    expect(() =>
      parseProcessRequestJson("[]", createProcessDescription()),
    ).toThrow("Process request import must be a JSON object.");
  });

  it("rejects imported requests with the wrong input structure", () => {
    const processDescription = createProcessDescription();

    expect(() =>
      parseProcessRequestJson(
        JSON.stringify({
          inputs: {
            scene: { id: "demo" },
          },
        }),
        processDescription,
      ),
    ).toThrow("Type of inputs.scene must be string");
  });
});

function createProcessDescription(): ProcessDescription {
  return {
    id: "demo-process",
    version: "1.0.0",
    inputs: {
      scene: {
        schema: {
          type: "string",
        },
      },
    },
    outputs: {
      result: {},
    },
  };
}
