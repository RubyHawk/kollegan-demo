/**
 * Central tool registry — the heart of the automation platform.
 *
 * All LLM-callable tools (Vapi voice tools AND workflow step tools) register
 * here at startup. This single registry serves:
 *
 *   1. Vapi voice agent   → tools called mid-call via /api/ai/* endpoints
 *   2. Workflow engine     → tools called as 'tool_call' step type
 *   3. ReAct LLM loops    → tools available to LLM during reasoning steps
 *   4. API documentation  → listTools() generates OpenAPI-compatible tool list
 *
 * Registration pattern — each module has a register.ts that calls registerTool():
 *   features/voice/register.ts   → hotel.*, crm.*
 *   features/leads/register.ts   → leads.*
 *   features/offers/register.ts  → offers.*
 *   ...
 *
 * Tools are namespaced: '<module>.<action>' e.g. 'hotel.check_availability'
 */

import { logger } from '@core/logging/logger';

const TAG = 'ToolRegistry';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ToolContext {
  /** Organization making the request */
  orgId?: string;
  /** The workflow run executing this tool, if any */
  runId?: string;
  /** The Vapi call ID, if called from a voice agent */
  vapiCallId?: string;
  /** Arbitrary metadata passed by the caller */
  meta?: Record<string, unknown>;
}

export type ToolFn<TArgs = unknown, TResult = unknown> = (
  args: TArgs,
  ctx: ToolContext,
) => Promise<TResult>;

export interface ToolDefinition {
  /**
   * Namespaced tool name. Convention: '<module>.<verb>_<noun>'
   * Examples: 'hotel.check_availability', 'crm.upsert_contact', 'leads.create'
   */
  name: string;
  /** Human-readable description — shown in LLM system prompts and API docs */
  description: string;
  /** The tool implementation */
  fn: ToolFn;
}

// ─── Registry internals ───────────────────────────────────────────────────────

const registry = new Map<string, ToolDefinition>();

/**
 * Register a tool. Idempotent in development (HMR safe).
 * Throws on duplicate registration in production.
 */
export function registerTool(def: ToolDefinition): void {
  if (registry.has(def.name)) {
    if (process.env.NODE_ENV !== 'production') {
      registry.set(def.name, def);
      return;
    }
    throw new Error(`Tool "${def.name}" is already registered.`);
  }
  registry.set(def.name, def);
  logger.info(TAG, `Registered tool "${def.name}"`);
}

/** Look up a registered tool by name. Returns undefined if not found. */
export function getTool(name: string): ToolDefinition | undefined {
  return registry.get(name);
}

/**
 * Call a registered tool by name.
 * @throws if the tool is not registered.
 */
export async function callTool<TResult = unknown>(
  name: string,
  args: unknown,
  ctx: ToolContext = {},
): Promise<TResult> {
  const tool = registry.get(name);
  if (!tool) {
    throw new Error(`Tool "${name}" is not registered. Available: ${[...registry.keys()].join(', ')}`);
  }
  logger.info(TAG, `Calling tool "${name}"`, { orgId: ctx.orgId, runId: ctx.runId });
  return tool.fn(args, ctx) as Promise<TResult>;
}

/**
 * Returns name + description of every registered tool.
 * Used for LLM system prompts, API documentation, and the workflow builder UI.
 */
export function listTools(): Array<{ name: string; description: string }> {
  return Array.from(registry.values()).map(({ name, description }) => ({
    name,
    description,
  }));
}

/** Returns total number of registered tools — useful for health checks. */
export function toolCount(): number {
  return registry.size;
}
