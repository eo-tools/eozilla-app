import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createRemoteStateClient,
  type IncomingMessage,
  type OutgoingMessage,
} from "remotestate";
import { getPathAt, setPathAt } from "remotestate/path";

import type { ProcessRequest } from "@/service";
import { UrlService } from "@/service/services/url";
import { createProcessOutputSetter } from "./processOutputs";

// Keep the real RemoteState client and its undefined-to-null JSON serializer.
// Only the socket and the Python store's JSON get/set responses are simulated.
class StoreWebSocket {
  static state: unknown;
  readyState = 1;
  onmessage?: (event: { data: string }) => void;

  send(text: string) {
    const message = JSON.parse(text) as IncomingMessage;
    queueMicrotask(() => {
      let response: OutgoingMessage;
      if (message.type === "get") {
        response = {
          type: "get_result",
          call_id: message.call_id,
          path: message.path,
          value: getPathAt(StoreWebSocket.state, message.path),
        };
      } else if (message.type === "set") {
        StoreWebSocket.state = setPathAt(
          StoreWebSocket.state,
          message.path,
          message.value,
        );
        response = {
          type: "set_result",
          call_id: message.call_id,
          updates: [{ path: message.path, value: message.value }],
        };
      } else {
        throw new Error(`Unexpected message: ${message.type}`);
      }
      this.onmessage?.({ data: JSON.stringify(response) });
    });
  }

  close() {
    this.readyState = 3;
  }
}

async function createFixture() {
  StoreWebSocket.state = {
    processRequests: {
      echo: {
        inputs: { message: "Hello World", optional: null },
        outputs: {
          hello_out: {},
          metadata: { transmissionMode: "reference" },
        },
        response: "document",
      },
    },
  };
  vi.stubGlobal("WebSocket", StoreWebSocket);
  const client = createRemoteStateClient("ws://example.test/ws");
  client.store.provide(["processRequests"]);
  await Promise.resolve();
  return {
    client,
    setOutput: createProcessOutputSetter(client.store),
    getRequest: () =>
      (client.store.get(["processRequests"]) as Record<string, ProcessRequest>)
        .echo,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("process output selection through RemoteState", () => {
  it("omits a deselected output from the execution POST and preserves other values", async () => {
    const { client, setOutput, getRequest } = await createFixture();
    try {
      await setOutput("echo", "hello_out", undefined);
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ jobID: "job-1", status: "accepted" }), {
          status: 201,
        }),
      );
      vi.stubGlobal("fetch", fetchMock);
      const service = new UrlService(
        "cuiman",
        "https://example.test/_cuiman/service/",
        { id: "user", displayName: "User" },
        {},
      );
      await service.executeProcess("echo", getRequest());

      expect(getRequest().outputs).not.toHaveProperty("hello_out");
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        inputs: { message: "Hello World", optional: null },
        outputs: { metadata: { transmissionMode: "reference" } },
        response: "document",
      });
    } finally {
      client.dispose();
    }
  });

  it("keeps rapid deselections after asynchronous state acknowledgements", async () => {
    const { client, setOutput, getRequest } = await createFixture();
    try {
      await Promise.all([
        setOutput("echo", "hello_out", undefined),
        setOutput("echo", "metadata", undefined),
      ]);
      expect(getRequest().outputs).toEqual({});
    } finally {
      client.dispose();
    }
  });

  it("initializes an absent output mapping when selecting an output", async () => {
    const { client, setOutput, getRequest } = await createFixture();
    try {
      await client.store.set(["processRequests", "echo"], {
        inputs: { message: "Hello World" },
      });
      await setOutput("echo", "hello_out", {});
      expect(getRequest()).toEqual({
        inputs: { message: "Hello World" },
        outputs: { hello_out: {} },
      });
    } finally {
      client.dispose();
    }
  });

  it("does not create a partial request if the process is no longer available", async () => {
    const { client, setOutput } = await createFixture();
    try {
      await setOutput("missing", "hello_out", undefined);
      expect(client.store.get(["processRequests"])).not.toHaveProperty(
        "missing",
      );
    } finally {
      client.dispose();
    }
  });

  it("allows another output edit after a failed write", async () => {
    const { client, setOutput, getRequest } = await createFixture();
    try {
      vi.spyOn(client.store, "set").mockRejectedValueOnce(
        new Error("write failed"),
      );
      await expect(setOutput("echo", "hello_out", undefined)).rejects.toThrow(
        "write failed",
      );
      await setOutput("echo", "metadata", undefined);
      expect(getRequest().outputs).toEqual({ hello_out: {} });
    } finally {
      client.dispose();
    }
  });

  it("can reselect an output and change its options after deselection", async () => {
    const { client, setOutput, getRequest } = await createFixture();
    try {
      await Promise.all([
        setOutput("echo", "hello_out", undefined),
        setOutput("echo", "hello_out", {}),
        setOutput("echo", "metadata", { transmissionMode: "value" }),
      ]);
      expect(getRequest().outputs).toEqual({
        hello_out: {},
        metadata: { transmissionMode: "value" },
      });
    } finally {
      client.dispose();
    }
  });
});
