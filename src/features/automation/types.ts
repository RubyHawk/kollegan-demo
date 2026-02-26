/**
 * Automation & Workflow domain types — core domain.
 *
 * These are the most important types in the platform.
 * A Workflow is a directed sequence of Steps, triggered by an Event, Schedule,
 * Webhook, or manual invocation. Each execution is a Run.
 */

// ─── Triggers ─────────────────────────────────────────────────────────────────

export type TriggerType = 'event' | 'schedule' | 'webhook' | 'manual';

export interface EventTrigger {
  type: 'event';
  /** Domain event type that fires this workflow, e.g. 'room.booked' */
  eventType: string;
  /** Optional filter: only trigger if payload matches these key/value pairs */
  filter?: Record<string, unknown>;
}

export interface ScheduleTrigger {
  type: 'schedule';
  /** Standard cron expression, e.g. '0 9 * * 1-5' (weekdays at 09:00) */
  cron: string;
  /** IANA timezone, e.g. 'Europe/Stockholm'. Defaults to UTC. */
  timezone?: string;
}

export interface WebhookTrigger {
  type: 'webhook';
  /** Unique token embedded in the webhook URL: /api/webhooks/{token} */
  token: string;
}

export interface ManualTrigger {
  type: 'manual';
}

export type TriggerConfig =
  | EventTrigger
  | ScheduleTrigger
  | WebhookTrigger
  | ManualTrigger;

// ─── Steps ────────────────────────────────────────────────────────────────────

export type StepType =
  | 'tool_call'
  | 'llm'
  | 'condition'
  | 'wait'
  | 'human_in_loop'
  | 'parallel';

export type OnError = 'fail' | 'continue' | 'retry';

/** Common fields on every step */
interface BaseStep {
  /** Unique step ID within this workflow. Referenced by condition branches. */
  id: string;
  name?: string;
  onError?: OnError;
}

export interface ToolCallStep extends BaseStep {
  type: 'tool_call';
  /** Registered tool name, e.g. 'hotel.check_availability' */
  toolName: string;
  /**
   * Argument template. Values may reference previous step outputs:
   *   "{{trigger.payload.guestName}}"
   *   "{{steps.step_1.output.customerId}}"
   */
  args: Record<string, unknown>;
}

export interface LLMStep extends BaseStep {
  type: 'llm';
  /** Prompt template. Supports variable interpolation: {{trigger.payload.x}} */
  prompt: string;
  model?: string;
  /** Tool names the LLM may call during this step (subset of registry) */
  allowedTools?: string[];
  /** Max ReAct iterations before forcing a final answer (default: 5) */
  maxIterations?: number;
}

export interface ConditionStep extends BaseStep {
  type: 'condition';
  /**
   * JavaScript expression evaluated against the run context.
   * Example: "steps.lookup.output.found === true"
   */
  expression: string;
  /** Step ID to run when expression is truthy */
  truePath: string;
  /** Step ID to run when expression is falsy */
  falsePath: string;
}

export interface WaitStep extends BaseStep {
  type: 'wait';
  /** Duration in milliseconds */
  durationMs: number;
}

export interface HumanInLoopStep extends BaseStep {
  type: 'human_in_loop';
  /** Instruction displayed to the human reviewer */
  prompt: string;
  /** Where to send the notification: 'email' | 'slack' | 'dashboard' */
  notifyVia: string[];
  /** Timeout in ms — if no response, run fails with timeout error */
  timeoutMs?: number;
}

export interface ParallelStep extends BaseStep {
  type: 'parallel';
  /** Step IDs to run concurrently. Execution continues when all complete. */
  branchStepIds: string[];
}

export type StepConfig =
  | ToolCallStep
  | LLMStep
  | ConditionStep
  | WaitStep
  | HumanInLoopStep
  | ParallelStep;

// ─── Workflow ──────────────────────────────────────────────────────────────────

export interface WorkflowDefinition {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  trigger: TriggerConfig;
  /** Ordered list of steps. Conditions and parallel steps may branch. */
  steps: StepConfig[];
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Runs ──────────────────────────────────────────────────────────────────────

export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowRun {
  id: string;
  orgId: string;
  workflowId: string;
  status: RunStatus;
  /** The event/payload that triggered this run */
  trigger: Record<string, unknown>;
  /** Live execution context: step outputs + variables */
  context: RunContext;
  startedAt: string;
  completedAt?: string;
  error?: string;
  steps: WorkflowRunStep[];
}

export interface WorkflowRunStep {
  id: string;
  runId: string;
  stepId: string;
  status: StepStatus;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
  error?: string;
  retryCount: number;
}

// ─── Run context ───────────────────────────────────────────────────────────────

/**
 * The execution context available to every step during a workflow run.
 * Steps can read previous step outputs via context.stepOutputs['step_id'].
 */
export interface RunContext {
  runId: string;
  workflowId: string;
  orgId: string;
  /** The payload that triggered this run (domain event, webhook body, etc.) */
  triggerPayload: Record<string, unknown>;
  /** Map of stepId → step output (populated as steps complete) */
  stepOutputs: Record<string, unknown>;
  /** User-defined variables, set by LLM steps or condition branches */
  variables: Record<string, unknown>;
}

// ─── Agent memory ───────────────────────────────────────────────────────────────

export interface SessionMemory {
  /** Ephemeral — lives for the duration of one run or call session */
  data: Record<string, unknown>;
}

export interface OrgMemory {
  /** Persistent per-org — customer preferences, past interactions, config */
  orgId: string;
  data: Record<string, unknown>;
  updatedAt: string;
}
