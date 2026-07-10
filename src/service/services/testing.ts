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
      title: "stacitemsfile",
      schema: {
        type: "string",
        format: "uri",
        nullable: false,
      },
    },
  },
  fn(inputs): JobResults {
    const result = Object.fromEntries(
      Object.entries(inputs).filter(([, value]) => value != null),
    );
    const json = JSON.stringify(result);
    return {
      return_value: `data:application/json,${encodeURIComponent(json)}`,
    };
  },
};

const PROCESSES: Process[] = [L3B_PROCESS];
const PROCESS_MAP = new Map(PROCESSES.map((process) => [process.id, process]));

export class TestingService implements Service {
  private readonly delay: number;
  private readonly jobDuration: number;
  private readonly jobs = new Map<string, Job>();
  private nextJobId = 0;

  readonly root: ServiceMetadata = {
    title: "Testing Server",
    description: "In-memory testing server used for local development.",
    capabilities: ["processes", "jobs"],
  };

  constructor(delay: number = 500, jobDuration: number = 5000) {
    this.delay = delay;
    this.jobDuration = jobDuration;
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
        ({ inputs: _inputs, outputs: _outputs, fn: _fn, ...summary }) =>
          summary,
      ),
      links: [],
    }));
  }

  async getProcess(processId: string): Promise<ProcessDescription> {
    return await delayed(this.delay, () => {
      const process = this.getKnownProcess(processId);
      const { fn: _fn, ...description } = process;
      return description;
    });
  }

  async executeProcess(
    processId: string,
    processRequest: ProcessRequest,
  ): Promise<JobInfo> {
    const { fn } = this.getKnownProcess(processId);
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
    this.runJob(job, fn, processRequest.inputs ?? {});
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
    fn: ProcessFn,
    inputs: Record<string, unknown>,
  ): void {
    const steps = 10;
    let completedSteps = 0;
    job.status = "running";
    job.message = "Started processing";
    job.started = timestamp();
    job.updated = job.started;

    job.timer = setInterval(
      () => {
        completedSteps += 1;
        job.progress = Math.min(completedSteps * 10, 100);
        job.updated = timestamp();
        if (completedSteps < steps) {
          return;
        }

        stopJobTimer(job);
        try {
          job.result = fn(inputs);
          job.status = "successful";
          job.message = "Ended processing";
        } catch (error) {
          job.status = "failed";
          job.message = error instanceof Error ? error.message : String(error);
        }
        job.finished = timestamp();
        job.updated = job.finished;
      },
      this.jobDuration / steps,
    );
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

function toJobInfo({ result: _result, timer: _timer, ...job }: Job): JobInfo {
  return { ...job };
}
