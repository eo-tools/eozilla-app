import { isJsonValue, type JsonValue, type JsonSchema } from "@/utils/json";
import { isObject } from "@/utils/common";

export interface ProcessList {
  /**The process summaries.*/
  processes: ProcessSummary[];
  /**Related links*/
  links?: Link[];
}

export interface Description {
  title?: string;
  description?: string;
  /**Optional list of keywords.*/
  keywords?: string[];
  /**Optional list of related metadata.*/
  metadata?: Metadata[];
}

/**
 * Metadata returned by the service root endpoint.
 */
export interface ServiceMetadata extends Description {
  /**Declared capabilities of the service. */
  capabilities?: unknown;
  /**Related links. */
  links?: Link[];
}

/** Provided input of a process execution.*/
export type Input = JsonValue;

/** Expected output of a process execution. */
export interface Output {
  /**Desired format.*/
  format?: Format;
  /**Desired transmission mode.*/
  transmissionMode?: TransmissionMode;
}

/**Description of an input of a process.*/
export interface InputDescription extends Description {
  /**Minimum number of occurrences of this input.
  Usually ignored as an array schema is more flexible.*/
  minOccurs?: number;

  /**Maximum number of occurrences of this input.
  Usually ignored as an array schema is more flexible.*/
  maxOccurs?: number | "unbounded";

  /**The OpenAPI schema of the input value.*/
  schema: JsonSchema;
}

/**Description of an output of a process.*/
export interface OutputDescription extends Description {
  /**The OpenAPI schema of the output value.*/
  schema?: JsonSchema;
}

/**How a process execution will deliver its results.*/
export type TransmissionMode = "value" | "reference";

/**Options to control job execution.*/
export type JobControlOptions = "sync-execute" | "async-execute" | "dismiss";

/**A process description without the details of inputs and outputs.*/
export interface ProcessSummary extends Description {
  /**Process identifier.*/
  id: string;
  /**Process version number.*/
  version: string;
  /**Available options to control process execution.*/
  jobControlOptions?: JobControlOptions[];
  /**Available output transmission modes.*/
  outputTransmission?: TransmissionMode[];
  /**Related links.*/
  links?: Link[];
}

/**A process description including the details of inputs and outputs.*/
export interface ProcessDescription extends ProcessSummary {
  /**Descriptions of the process inputs.*/
  inputs: Record<string, InputDescription>;
  outputs: Record<string, OutputDescription>;
}

/**
 * Optional URIs for callbacks for this job.
 *
 * Support for this parameter is not required and the parameter may be
 * removed from the API definition, if conformance class **'callback'**
 * is not listed in the conformance declaration under `/conformance`.
 */
export interface Subscriber {
  /**Optional callback URI to notify about a successfully executed job.*/
  successUri?: string;

  /**Optional callback URI to notify about the incremental progress made by a job.*/
  inProgressUri?: string;

  /**Optional callback URI to notify in case of a job failure.*/
  failedUri?: string;
}

/** Expected process execution result type. */
export type ResponseType = "raw" | "document";

/** Inputs of a process request. */
export type ProcessInputs = Record<string, Input>;

/** Outputs of a process request. */
export type ProcessOutputs = Record<string, Output>;

/**
 * A request for a process execution.
 */
export interface ProcessRequest {
  /**
   * Optional process inputs given as key-value mapping.
   * Values may be of any JSON-serializable type accepted by
   * the given process.
   */
  inputs?: ProcessInputs;

  /**
   * Optional process outputs given as key-value mapping.
   * Values are of type ``Output`` supported by the given process.
   */
  outputs?: ProcessOutputs;

  /**
   * Optional subscriber of type ``Subscriber`` comprising callback URLs
   * that are informed about process status changes while the
   * processing takes place.
   */
  subscriber?: Subscriber;

  /**
   * Optional response type given as key-value mapping.
   * May be just ignored.
   */
  response?: ResponseType;
}

/**
 * List of jobs.
 */
export interface JobList {
  /**The job information list.*/
  jobs: JobInfo[];

  /**Related links.*/
  links?: Link[];
}

/**
 * Status of a job.
 */
export type JobStatus =
  | "accepted"
  | "running"
  | "successful"
  | "failed"
  | "dismissed";

export interface JobInfo {
  /**The job identifier.*/
  jobID: string;

  /**The job's process identifier.*/
  processID: string;

  /**The job type (always "process", ignored).*/
  type: "process";

  /**The job status.*/
  status: JobStatus;

  /**The success, progress, or failure message.*/
  message?: string;

  /**Job creation time.*/
  created?: string;

  /**Job start time.*/
  started?: string;

  /**Job end time.*/
  finished?: string;

  /**Job update time.*/
  updated?: string;

  /**The progress in percent in the range 0 to 100.*/
  progress?: number;

  /**Related links.*/
  links?: Link[];

  // recognized extensions
  /**Server-side traceback in case of failure.*/
  "x-traceback"?: string | string[];
}

/**
 * The type representing a single result of a job.
 */
export type JobResult = Link | QualifiedValue | InlineValue;

export interface JobResults {
  [name: string]: JobResult;
}

export type InlineValue = JsonValue;

/**
 * A qualified value.
 */
export interface QualifiedValue extends Format {
  /**The (JSON) value.*/
  value: JsonValue;
}

/**
 * A link.
 */
export interface Link {
  /**The link's URL. Required.*/
  href: string;

  /**The link's relation.*/
  rel?: string;

  /**The link's mime-type.*/
  type?: string;

  /**The natural language used by the URL.*/
  hreflang?: string;

  /**The link's title.*/
  title?: string;
}

/**
 * A metadata reference.
 */
export interface Metadata {
  /**Metadata's title.*/
  title?: string;

  /**Metadata's role.*/
  role?: string;

  /**Metadata's URL.*/
  href?: string;
}

/**
 * Specifies a value's data type and encoding.
 */
export interface Format {
  /**The value's media / mime type.*/
  mediaType?: string;

  /**The value's title encoding. For title values only.*/
  encoding?: string;

  /**The OpenAPI schema or schema URI.*/
  schema?: string | JsonSchema;
}

/**
 * API error information based on RFC 7807.
 */
export interface ApiError {
  /**Error type.*/
  type: string;

  /**Error title.*/
  title?: string;

  /**HTTP status code.*/
  status: number;

  /**Detailed error message.*/
  detail?: string;

  /**Instance information.*/
  instance?: string;

  // recognized "x-" extensions

  /**Server-side traceback.*/
  traceback?: string | string[];
}

///////////////////////////////////////////////
// Helpers

export function isLink(jobResult: JobResult): jobResult is Link {
  return isObject(jobResult) && "href" in jobResult;
}

export function isQualifiedValue(
  jobResult: JobResult,
): jobResult is QualifiedValue {
  return isObject(jobResult) && "value" in jobResult;
}

export function isInlineValue(jobResult: JobResult): jobResult is InlineValue {
  return isJsonValue(jobResult);
}
