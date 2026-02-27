/**
 * Automation module — public interface.
 *
 * Other modules ONLY import from this file.
 * Never import from internal sub-layers directly.
 *
 * Layer structure:
 *   domain/         — pure business objects (workflow entity, step types, triggers)
 *   application/    — orchestration (use cases, workflow engine) [Phase 2]
 *   infrastructure/ — persistence (workflow repository) [Phase 2]
 *   tools/          — the central AI tool registry
 *   events/         — workflow.events.ts + subscribers/domain-events.subscriber.ts
 *   ui/             — components, hooks, pages [Phase 3]
 */

// Tool registry — the primary API other modules use to register and call tools
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
} from './domain/workflow.entity';

// Domain events
export {
  WORKFLOW_TRIGGERED,
  WORKFLOW_COMPLETED,
  WORKFLOW_FAILED,
  WORKFLOW_CANCELLED,
  STEP_COMPLETED,
  STEP_FAILED,
} from './events/workflow.events';
export type {
  WorkflowTriggeredEvent,
  WorkflowCompletedEvent,
  WorkflowFailedEvent,
  WorkflowCancelledEvent,
  StepCompletedEvent,
  StepFailedEvent,
  AutomationEvent,
} from './events/workflow.events';
