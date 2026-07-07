import { describe, expect, it } from "vitest";

import type { ProcessDescription, ProcessRequest } from "@/service";
import type { JsonSchema } from "@/utils/json";
import { ensureInitialProcessRequest } from "./processRequests";

describe("process request initialization", () => {
  it("keeps edited process input values when a process request already exists", () => {
    const processA = createProcessDescription("process-a", {
      value: { type: "string", default: "default-a" },
    });
    const processB = createProcessDescription("process-b", {
      value: { type: "string", default: "default-b" },
    });
    const editedProcessARequest: ProcessRequest = {
      inputs: { value: "edited-a" },
      outputs: { result: { transmissionMode: "reference" } },
    };
    const processRequests = {
      "process-a": editedProcessARequest,
    };

    const processARequest = ensureInitialProcessRequest(
      processRequests,
      processA,
    );
    const processBRequest = ensureInitialProcessRequest(
      processRequests,
      processB,
    );

    expect(processARequest).toBe(editedProcessARequest);
    expect(processARequest.inputs).toEqual({ value: "edited-a" });
    expect(processBRequest).toEqual({
      inputs: { value: "default-b" },
      outputs: { result: {} },
    });
  });
});

function createProcessDescription(
  id: string,
  inputs: Record<string, JsonSchema>,
): ProcessDescription {
  return {
    id,
    version: "1.0.0",
    inputs: Object.fromEntries(
      Object.entries(inputs).map(([name, schema]) => [name, { schema }]),
    ) as ProcessDescription["inputs"],
    outputs: {
      result: {},
    },
  };
}
