import type { ProcessRequest, Service } from "@/service";
import { isObject } from "@/utils/common";

export const JOB_REQUEST_ARCHIVE_KEY = "eozilla.jobRequests.v1";
export const MAX_STORED_JOB_REQUESTS = 500;
export const MAX_JOB_REQUEST_ARCHIVE_BYTES = 2 * 1024 * 1024;

export interface StoredJobRequest {
  processId: string;
  request: ProcessRequest;
}

export type StoredJobRequests = Record<string, StoredJobRequest>;

interface JobRequestRecord extends StoredJobRequest {
  serviceId: string;
  jobId: string;
  storedAt: number;
}

type JobRequestStorage = Pick<Storage, "getItem" | "setItem">;

export function cloneProcessRequest(request: ProcessRequest): ProcessRequest {
  return JSON.parse(JSON.stringify(request)) as ProcessRequest;
}

export function loadJobRequests(
  storage: JobRequestStorage,
  service: Pick<Service, "storageId">,
): StoredJobRequests {
  return Object.fromEntries(
    readRecords(storage)
      .filter((record) => record.serviceId === service.storageId)
      .map((record) => [
        record.jobId,
        {
          processId: record.processId,
          request: cloneProcessRequest(record.request),
        },
      ]),
  );
}

export function saveJobRequest(
  storage: JobRequestStorage,
  service: Pick<Service, "storageId">,
  jobId: string,
  storedRequest: StoredJobRequest,
): void {
  const records = readRecords(storage).filter(
    (record) =>
      record.serviceId !== service.storageId || record.jobId !== jobId,
  );
  const latestStoredAt = records.reduce(
    (latest, record) => Math.max(latest, record.storedAt),
    0,
  );
  const newRecord: JobRequestRecord = {
    serviceId: service.storageId,
    jobId,
    processId: storedRequest.processId,
    request: cloneProcessRequest(storedRequest.request),
    storedAt: Math.max(Date.now(), latestStoredAt + 1),
  };
  records.push(newRecord);
  writeRecords(storage, records, newRecord);
}

function readRecords(storage: JobRequestStorage): JobRequestRecord[] {
  try {
    const value: unknown = JSON.parse(
      storage.getItem(JOB_REQUEST_ARCHIVE_KEY) ?? "[]",
    );
    return Array.isArray(value) ? value.filter(isJobRequestRecord) : [];
  } catch (_error) {
    return [];
  }
}

function isJobRequestRecord(value: unknown): value is JobRequestRecord {
  return (
    isObject(value) &&
    typeof value.serviceId === "string" &&
    typeof value.jobId === "string" &&
    typeof value.processId === "string" &&
    isObject(value.request) &&
    typeof value.storedAt === "number"
  );
}

function writeRecords(
  storage: JobRequestStorage,
  records: JobRequestRecord[],
  newRecord: JobRequestRecord,
): void {
  let serialized = JSON.stringify(records);
  while (
    records.length > MAX_STORED_JOB_REQUESTS ||
    getByteSize(serialized) > MAX_JOB_REQUEST_ARCHIVE_BYTES
  ) {
    if (!removeOldestRecord(records, newRecord)) {
      throw new Error("The process request is too large to retain locally.");
    }
    serialized = JSON.stringify(records);
  }

  while (true) {
    try {
      storage.setItem(JOB_REQUEST_ARCHIVE_KEY, serialized);
      return;
    } catch (error) {
      if (
        !isQuotaExceededError(error) ||
        !removeOldestRecord(records, newRecord)
      ) {
        throw error;
      }
      serialized = JSON.stringify(records);
    }
  }
}

function removeOldestRecord(
  records: JobRequestRecord[],
  newRecord: JobRequestRecord,
): boolean {
  const oldest = records
    .filter((record) => record !== newRecord)
    .reduce<JobRequestRecord | undefined>(
      (result, record) =>
        !result || record.storedAt < result.storedAt ? record : result,
      undefined,
    );
  if (!oldest) {
    return false;
  }
  records.splice(records.indexOf(oldest), 1);
  return true;
}

function getByteSize(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isQuotaExceededError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}
