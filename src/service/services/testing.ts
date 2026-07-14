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
import type { JsonValue } from "@/utils/json";

interface Process extends ProcessDescription {
  run: (job: Job, inputs: Record<string, unknown>) => void;
}

interface Job extends JobInfo {
  result?: JobResults;
  timer?: ReturnType<typeof setInterval>;
}

const L3B_PROCESS: Process = {
  id: "218",
  title: "L3B AOI Indicators Processor",
  version: "5.0.4",
  description:
    "Site Processing L3B NDVI Processor (demo from ESA Sen3CAP project).",
  inputs: {
    start_date: {
      title: "Start date",
      schema: {
        type: "string",
        format: "date",
        nullable: false,
        "x-ui-order": 10,
      },
    },
    end_date: {
      title: "End date",
      schema: {
        type: "string",
        format: "date",
        nullable: false,
        "x-ui-order": 11,
      },
    },
    geometry: {
      title: "Geometry (WKT)",
      schema: {
        type: "string",
        format: "wkt",
        nullable: false,
        "x-ui-widget": "map",
        "x-ui-order": 20,
      },
    },
    indicator_name: {
      title: "L3B Indicator Name",
      schema: {
        type: "string",
        enum: ["NDVI", "LAI", "FAPAR", "FCOVER", "NDWI"],
        nullable: true,
        "x-ui-widget": "radio",
        "x-ui-advanced": true,
        "x-ui-order": 30,
      },
    },
    site_extend: {
      title: "Site extent",
      schema: {
        type: "string",
        format: "wkt",
        nullable: true,
        "x-ui-order": 40,
      },
    },
  },
  outputs: {
    return_value: {
      title: "JSON result",
      schema: {
        type: "object",
        nullable: false,
      },
    },
  },
  run(job, inputs): void {
    startJob(job);
    const result = Object.fromEntries(
      Object.entries(inputs).filter(([, value]) => value != null),
    ) as Record<string, JsonValue>;
    endJob(job, "successful", "Ended processing", {
      return_value: result,
    });
  },
};

const SLEEP_A_WHILE_PROCESS: Process = {
  id: "sleep_a_while",
  title: "Sleep Processor",
  version: "1.0.0",
  description: "Sleeps for `duration` seconds; fails at 50% when `fail` is true.",
  inputs: {
    duration: {
      title: "Duration",
      schema: {
        type: "number",
        nullable: false,
        default: 10,
        "x-ui-order": 10,
      },
    },
    fail: {
      title: "Fail",
      schema: {
        type: "boolean",
        nullable: false,
        default: false,
        "x-ui-order": 20,
      },
    },
  },
  outputs: {
    return_value: {
      title: "Sleep duration",
      schema: {
        type: "number",
        nullable: false,
      },
    },
  },
  run(job, inputs): void {
    runSleepJob(job, inputs);
  },
};

const PROCESSES: Process[] = [L3B_PROCESS, SLEEP_A_WHILE_PROCESS];
const PROCESS_MAP = new Map(PROCESSES.map((process) => [process.id, process]));

export class TestingService implements Service {
  private readonly delay: number;
  private readonly jobs = new Map<string, Job>();
  private nextJobId = 0;

  readonly meta: ServiceMetadata = {
    title: "Testing Server",
    description: "In-memory testing server used for local development.",
    capabilities: ["processes", "jobs"],
  };

  constructor(delay: number = 500) {
    this.delay = delay;
  }

  get providerId() {
    return "testing";
  }

  get user(): UserIdentity {
    return { id: "unknown", displayName: "anonymous User" };
  }

  async getProcesses(): Promise<ProcessList> {
    return await delayed(this.delay, () => ({
      processes: PROCESSES.map(
        ({ inputs: _inputs, outputs: _outputs, run: _run, ...summary }) =>
          summary,
      ),
      links: [],
    }));
  }

  async getProcess(processId: string): Promise<ProcessDescription> {
    return await delayed(this.delay, () => {
      const process = this.getKnownProcess(processId);
      const { run: _run, ...description } = process;
      return description;
    });
  }

  async executeProcess(
    processId: string,
    processRequest: ProcessRequest,
  ): Promise<JobInfo> {
    const process = this.getKnownProcess(processId);
    this.nextJobId += 1;
    const job: Job = {
      jobID: this.nextJobId.toString(),
      processID: processId,
      type: "process",
      status: "accepted",
      message: "Accepted for processing",
      created: timestamp(),
      progress: 0,
    };
    this.jobs.set(job.jobID, job);
    const acceptedJob = toJobInfo(job);
    this.runJob(job, process, processRequest.inputs ?? {});
    return await delayed(this.delay, () => acceptedJob);
  }

  async getJobs(): Promise<JobList> {
    return await delayed(this.delay, () => ({
      jobs: Array.from(this.jobs.values(), toJobInfo),
      links: [],
    }));
  }

  async getJob(jobId: string): Promise<JobInfo> {
    return await delayed(this.delay, () => toJobInfo(this.getKnownJob(jobId)));
  }

  async getJobResults(jobId: string): Promise<JobResults> {
    return await delayed(this.delay, () => {
      const job = this.getKnownJob(jobId);
      if (job.status !== "successful" || !job.result) {
        throw new ServiceError({
          type: "Not Available",
          status: 403,
          title: `Job results for job ${jobId} are not available`,
        });
      }
      return job.result;
    });
  }

  async dismissJob(jobId: string): Promise<void> {
    return await delayed(this.delay, () => {
      const job = this.getKnownJob(jobId);
      if (job.status === "accepted" || job.status === "running") {
        stopJobTimer(job);
        job.status = "dismissed";
        job.message = "Processing dismissed";
        job.finished = timestamp();
        job.updated = job.finished;
      } else {
        this.jobs.delete(job.jobID);
      }
    });
  }

  close(): Promise<void> {
    this.jobs.forEach(stopJobTimer);
    return Promise.resolve();
  }

  private getKnownProcess(processId: string): Process {
    const process = PROCESS_MAP.get(processId);
    if (!process) {
      throw new ServiceError({
        type: "Not Found",
        status: 404,
        title: `Process '${processId}' not found`,
      });
    }
    return process;
  }

  private getKnownJob(jobId: string): Job {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new ServiceError({
        type: "Not Found",
        status: 404,
        title: `Job '${jobId}' not found`,
      });
    }
    return job;
  }

  private runJob(
    job: Job,
    process: Process,
    inputs: Record<string, unknown>,
  ): void {
    process.run(job, inputs);
  }
}

async function delayed<R>(delay: number, fn: () => R): Promise<Awaited<R>> {
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return fn() as Awaited<R>;
}

function timestamp(): string {
  return new Date().toISOString();
}

function stopJobTimer(job: Job): void {
  if (job.timer !== undefined) {
    clearInterval(job.timer);
    delete job.timer;
  }
}

function startJob(job: Job): void {
  job.status = "running";
  job.message = "Started processing";
  job.started = timestamp();
  job.updated = job.started;
  job.progress = 0;
}

function endJob(
  job: Job,
  status: "successful" | "failed",
  message: string,
  result?: JobResults,
): void {
  stopJobTimer(job);
  if (result !== undefined) {
    job.result = result;
  }
  job.status = status;
  job.message = message;
  job.finished = timestamp();
  job.updated = job.finished;
}

function runSleepJob(job: Job, inputs: Record<string, unknown>): void {
  const duration =
    typeof inputs.duration === "number" && Number.isFinite(inputs.duration)
      ? inputs.duration
      : 10;
  const fail = inputs.fail === true;
  const startedAt = Date.now();

  startJob(job);

  const stepDuration = (duration * 1000) / 100;
  let completedSteps = 0;

  job.timer = setInterval(() => {
    completedSteps += 1;
    job.progress = Math.min(completedSteps, 100);
    job.updated = timestamp();

    if (fail && completedSteps === 50) {
      endJob(job, "failed", "Woke up too early");
      return;
    }

    if (completedSteps < 100) {
      return;
    }

    endJob(job, "successful", "Ended processing", {
      return_value: (Date.now() - startedAt) / 1000,
    });
  }, stepDuration);
}

function toJobInfo({ result: _result, timer: _timer, ...job }: Job): JobInfo {
  return { ...job };
}
