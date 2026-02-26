export interface JobOptions {
  /** Delay in milliseconds before the job is processed */
  delayMs?: number;
  /** Max retry attempts on failure (0 = no retries) */
  retries?: number;
}

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  options: JobOptions;
  createdAt: string;
  attemptCount: number;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;
