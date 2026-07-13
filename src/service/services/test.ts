import type {
  JobInfo,
  JobList,
  JobResults,
  ProcessDescription,
  ProcessList,
  ProcessRequest,
  Service,
  ServiceMetadata,
  UserIdentity,
} from "@/service";
import { ServiceError } from "@/service/errors";

type ProcessFn = (inputs: Record<string, unknown>) => JobResults;

interface Process extends ProcessDescription {
  fn: ProcessFn;
}

interface Job extends JobInfo {
  result?: JobResults;
}

const JOB_MAP = new Map<string, Job>();

let JOB_ID = 0;

const PROCESSES: Process[] = [
  {
    id: "p1",
    version: "0.0.0",
    title: "P1",
    description: "Process `P1`",
    inputs: {},
    outputs: {},
    fn(_inputs: Record<string, unknown>): JobResults {
      return { returnValue: 42 };
    },
  },
  {
    id: "p2",
    version: "0.0.0",
    title: "P2",
    description: "Process `P2`",
    inputs: {},
    outputs: {},
    fn(_inputs: Record<string, unknown>): JobResults {
      return { returnValue: 137 };
    },
  },
];

const PROCESS_MAP = new Map(PROCESSES.map((p) => [p.id, p]));

function ensureValidProcessId(processId: string) {
  if (!PROCESS_MAP.has(processId)) {
    throw new ServiceError({
      type: "Not Found",
      status: 404,
      title: `Process '${processId}' not found`,
    });
  }
}

function assertValidJobId(jobId: string) {
  if (!JOB_MAP.has(jobId)) {
    throw new ServiceError({
      type: "Not Found",
      status: 404,
      title: `Job '${jobId}' not found`,
    });
  }
}

export class TestService implements Service {
  private readonly delay: number;
  readonly meta: ServiceMetadata = {
    title: "Test Server",
    description: "In-memory test server used for local development.",
    capabilities: ["processes", "jobs"],
  };

  constructor(delay: number = 500) {
    this.delay = delay;
  }

  get providerId() {
    return "test";
  }

  get user(): UserIdentity {
    return { id: "unknown", displayName: "anonymous User" };
  }

  async getProcesses(): Promise<ProcessList> {
    return await delayed(this.delay, () => ({
      processes: PROCESSES.map(
        ({ inputs: _i, outputs: _o, fn: _f, ...s }) => s,
      ),
      links: [],
    }));
  }

  async getProcess(processId: string): Promise<ProcessDescription> {
    return await delayed(this.delay, () => {
      ensureValidProcessId(processId);
      const { fn: _f, ...d } = PROCESS_MAP.get(processId)!;
      return d;
    });
  }

  async executeProcess(
    processId: string,
    processRequest: ProcessRequest,
  ): Promise<JobInfo> {
    ensureValidProcessId(processId);
    const { fn } = PROCESS_MAP.get(processId)!;
    JOB_ID += 1;
    const job: Job = {
      jobID: JOB_ID.toString(),
      processID: processId,
      type: "process",
      status: "accepted",
      created: new Date().toUTCString(),
    };
    JOB_MAP.set(job.jobID, job);
    return await runJob(job, fn, 5000, processRequest.inputs || {});
  }

  async getJobs(): Promise<JobList> {
    return await delayed(this.delay, () => {
      const jobs: JobInfo[] = [];
      JOB_MAP.forEach(({ result: _r, ...jobInfo }) => {
        jobs.push(jobInfo);
      });
      return { jobs, links: [] };
    });
  }

  async getJob(jobId: string): Promise<JobInfo> {
    return await delayed(this.delay, () => {
      assertValidJobId(jobId);
      const { result: _r, ...jobInfo } = JOB_MAP.get(jobId)!;
      return jobInfo;
    });
  }

  async getJobResults(jobId: string): Promise<JobResults> {
    return await delayed(this.delay, () => {
      assertValidJobId(jobId);
      const { result } = JOB_MAP.get(jobId)!;
      if (!result) {
        throw new ServiceError({
          type: "Not Available",
          status: 403,
          title: `Job results for job ${jobId} are not available`,
        });
      }
      return result;
    });
  }

  async dismissJob(jobId: string): Promise<void> {
    return await delayed(this.delay, () => {
      assertValidJobId(jobId);
      const job = JOB_MAP.get(jobId)!;
      if (job.status === "accepted" || job.status === "running") {
        job.status = "dismissed";
      } else {
        JOB_MAP.delete(job.jobID);
      }
    });
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

async function delayed<A extends unknown[], R>(
  delay: number,
  fn: (...args: A) => R,
  ...args: A
): Promise<Awaited<R>> {
  await new Promise((resolve) => setTimeout(resolve, delay));
  return fn(...args) as Awaited<R>;
}

async function runJob(
  job: Job,
  fn: ProcessFn,
  duration: number,
  inputs: Record<string, unknown>,
): Promise<JobInfo> {
  const n = 10;
  let i = 0;
  const delay = duration / 10;
  return await new Promise<JobInfo>((resolve, reject) => {
    job.status = "running";
    const intervalHandle: {
      current: ReturnType<typeof setInterval> | undefined;
    } = { current: undefined };
    const stop = () => {
      if (typeof intervalHandle.current !== "undefined") {
        clearInterval(intervalHandle.current);
      }
    };
    intervalHandle.current = setInterval(() => {
      if (job.status === "dismissed") {
        job.finished = new Date().toUTCString();
        stop();
        reject(`Job ${job.jobID} has been dismissed`);
        return;
      }
      i += 1;
      job.updated = new Date().toUTCString();
      if (i >= n) {
        job.status = "successful";
        job.result = fn(inputs);
        job.finished = new Date().toUTCString();
        stop();
        const { result: _r, ...jobInfo } = job;
        resolve(jobInfo);
      }
    }, delay);
  });
}
