import type {
  JobInfo,
  JobList,
  JobResults,
  ProcessDescription,
  ProcessList,
  ProcessRequest,
  ServiceMetadata,
} from "./models";

export interface Service {
  providerId: string;
  user: UserIdentity;
  meta: ServiceMetadata;
  getProcesses(): Promise<ProcessList>;
  getProcess(processId: string): Promise<ProcessDescription>;
  executeProcess(
    processId: string,
    processRequest: ProcessRequest,
  ): Promise<JobInfo>;
  getJobs(): Promise<JobList>;
  getJob(jobId: string): Promise<JobInfo>;
  getJobResults(jobId: string): Promise<JobResults>;
  dismissJob(jobId: string): Promise<void>;
  restartJob(jobId: string): Promise<JobInfo>;
  close(): Promise<void>;
}

export interface UserIdentity {
  id: string;
  displayName: string;
  email?: string;
}
