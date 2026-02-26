/**
 * Automation module — public interface.
 *
 * Other modules ONLY import from this file.
 * Never import from internal files: tools/registry.ts, types.ts, events.ts, listeners.ts
 */

// Tool registry — the primary API other modules use to register tools
export {
  registerTool,
  getTool,
  callTool,
  listTools,
  toolCount,
} from './tools/registry';
export type { ToolContext, ToolFn, ToolDefinition } from './tools/registry';

// Domain types
export type {
  WorkflowDefinition,
  WorkflowRun,
  WorkflowRunStep,
  RunContext,
  SessionMemory,
  OrgMemory,
  StepConfig,
  ToolCallStep,
  LLMStep,
  ConditionStep,
  WaitStep,
  HumanInLoopStep,
  ParallelStep,
  TriggerConfig,
  EventTrigger,
  ScheduleTrigger,
  WebhookTrigger,
  ManualTrigger,
  RunStatus,
  StepStatus,
  TriggerType,
  StepType,
  OnError,
} from './types';

// Domain events
export {
  WORKFLOW_TRIGGERED,
  WORKFLOW_COMPLETED,
  WORKFLOW_FAILED,
  WORKFLOW_CANCELLED,
  STEP_COMPLETED,
  STEP_FAILED,
} from './events';
export type {
  WorkflowTriggeredEvent,
  WorkflowCompletedEvent,
  WorkflowFailedEvent,
  WorkflowCancelledEvent,
  StepCompletedEvent,
  StepFailedEvent,
  AutomationEvent,
} from './events';
