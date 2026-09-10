import { describe, expect, it } from "vitest";

import type { Service } from "@/service";
import {
  JOB_REQUEST_ARCHIVE_KEY,
  MAX_JOB_REQUEST_ARCHIVE_BYTES,
  MAX_STORED_JOB_REQUESTS,
  loadJobRequests,
  saveJobRequest,
} from "./jobRequests";

const service = {
  storageId: "https://example.test/api/",
} as Pick<Service, "storageId">;

describe("job request localStorage archive", () => {
  it("removes the oldest request when the count limit is reached", () => {
    const storage = createStorage();
    const records = Array.from(
      { length: MAX_STORED_JOB_REQUESTS },
      (_, index) => ({
        serviceId: service.storageId,
        jobId: `job-${index}`,
        storedAt: index,
        ...createRequest(String(index)),
      }),
    );
    storage.setItem(
      JOB_REQUEST_ARCHIVE_KEY,
      JSON.stringify(records),
    );

    saveJobRequest(storage, service, "job-new", createRequest("new"));

    const archive = readAllRequests(storage);
    expect(Object.keys(archive)).toHaveLength(MAX_STORED_JOB_REQUESTS);
    expect(archive).not.toHaveProperty("job-0");
    expect(archive).toHaveProperty("job-new");
  });

  it("removes old requests when the byte limit is reached", () => {
    const storage = createStorage();
    saveJobRequest(
      storage,
      service,
      "job-old",
      createRequest("a".repeat(1_400_000)),
    );

    saveJobRequest(
      storage,
      service,
      "job-new",
      createRequest("b".repeat(800_000)),
    );

    expect(loadJobRequests(storage, service)).toEqual({
      "job-new": createRequest("b".repeat(800_000)),
    });
  });

  it("removes old requests and retries when the browser quota is lower", () => {
    const storage = createStorage(1_000);
    saveJobRequest(
      storage,
      service,
      "job-old",
      createRequest("a".repeat(400)),
    );

    saveJobRequest(
      storage,
      service,
      "job-new",
      createRequest("b".repeat(400)),
    );

    expect(loadJobRequests(storage, service)).toEqual({
      "job-new": createRequest("b".repeat(400)),
    });
  });

  it("rejects a single request that exceeds the archive limit", () => {
    const storage = createStorage();

    expect(() =>
      saveJobRequest(
        storage,
        service,
        "job-large",
        createRequest("x".repeat(MAX_JOB_REQUEST_ARCHIVE_BYTES)),
      ),
    ).toThrow("too large to retain locally");
    expect(storage.getItem(JOB_REQUEST_ARCHIVE_KEY)).toBeNull();
  });
});

function createRequest(value: string) {
  return {
    processId: "process-a",
    request: { inputs: { value }, outputs: { result: {} } },
  };
}

function createStorage(maxCharacters = Number.POSITIVE_INFINITY): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (value.length > maxCharacters) {
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      }
      data.set(key, value);
    },
    removeItem: (key: string) => data.delete(key),
    clear: () => data.clear(),
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    get length() {
      return data.size;
    },
  };
}

function readAllRequests(storage: Storage): Record<string, unknown> {
  const value = storage.getItem(JOB_REQUEST_ARCHIVE_KEY);
  const records = JSON.parse(value ?? "[]") as Array<{
    jobId: string;
  }>;
  return Object.fromEntries(records.map((record) => [record.jobId, record]));
}
