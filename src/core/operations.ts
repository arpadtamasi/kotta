/**
 * One operation, one declaration (BR-01m0nsyasfnjc9s4073r8zb33j, D-01m0nsz3vhrjkfv0r2y13mz0ys).
 *
 * Every operation Kotta exposes is named here once, with an identity that belongs to neither
 * surface: `task.submit-review` is spelled `task review` in the terminal and `task_submit_review`
 * in a calling chat, and both are projections of this entry. A mode of one service stays a flag on
 * its operation — `task.start` carries `--caller` rather than splitting in two — because the
 * service is one.
 *
 * The surfaces iterate this list to know what to build, so a command or a tool cannot exist
 * without an entry here, and an entry that names an exposure nobody built fails the totality test.
 * What is deliberately absent from a surface says why, in both directions: `absent` is a sentence,
 * never a silence.
 */

/** Entities the parameterised families cover. Adding one adds a command and a tool per family. */
export const FAMILY_ENTITIES = ["task", "observation", "decision", "batch"] as const;
export type FamilyEntity = typeof FAMILY_ENTITIES[number];

/** A surface either carries the operation under some name, or states why it does not. */
export type Exposure<T> = T | { readonly absent: string };

export interface OperationDeclaration {
  /** Surface-independent identity. Never a CLI or MCP spelling. */
  readonly id: string;
  /** What the operation does, in one line, for the reader of this list. */
  readonly summary: string;
  /** The CLI path, or the reason the terminal does not carry it. */
  readonly cli: Exposure<readonly string[]>;
  /** The MCP tool name, or the reason a calling chat does not carry it. */
  readonly mcp: Exposure<string>;
  /**
   * Whether the operation changes stored state. Declared, never inferred: a promise read off the
   * code it exists to constrain constrains nothing. `reads` is proved by running the operation
   * against a populated workspace and comparing it, and a `writes` operation summarised as a
   * report, a check or a validation fails by name (BR-01m0nsyasfnjc9s4073r8zb33j).
   */
  readonly effect: OperationEffect;
  /** Set when the operation expands over FAMILY_ENTITIES; names carry `{entity}`. */
  readonly family?: true;
}

/** `reads` leaves the workspace and the commit exactly as it found them. Everything else writes. */
export const OPERATION_EFFECTS = ["reads", "writes"] as const;
export type OperationEffect = typeof OPERATION_EFFECTS[number];

/**
 * Summary openings that promise a reader nothing will change. An operation that writes may not
 * open with one of these and say no more: the caller who expected a read and got a commit was not
 * warned by anything.
 */
export const REPORTING_VERBS = ["report", "validate", "check", "list", "read", "trace", "assemble", "show", "answer"] as const;

/**
 * Stems that admit a change, so a report-shaped summary of a writing operation can still be true.
 * Stems rather than words: a summary says "defining and committing", and a list of exact forms
 * would refuse the very sentence it asked for.
 */
export const WRITING_STEMS = ["writ", "commit", "record", "defin", "mov", "promot", "creat", "updat", "stor", "clos", "cancel", "releas", "appl", "chang"] as const;

const CHAT_GATED = "Reached from chat through approval_request, which elicits the human decision and applies the same service.";
const TERMINAL_SETUP = "Workspace setup and recovery: run by an operator in a terminal, not an operation a chat performs.";
const BATCH_SHAPING = "Batch shaping is coordination an operator performs; the tasks inside carry their own gates.";
const TERMINAL_RECOVERY = "Recovery path for a stuck execution; a chat that could release a claim could also mask the failure that produced it.";

export const OPERATIONS: readonly OperationDeclaration[] = [
  // The order here is the order the surfaces present: the CLI prints its commands in declaration
  // order, and a group takes the position of its first member. Reordering this list reorders help.
  { id: "workspace.migrate", summary: "Carry a workspace from any older shape to the current one.", cli: ["migrate"], mcp: { absent: TERMINAL_SETUP }, effect: "writes" },
  { id: "workspace.init", summary: "Initialize a repository-native workspace.", cli: ["init"], mcp: { absent: TERMINAL_SETUP }, effect: "writes" },
  { id: "workspace.sweep", summary: "Report what has stopped, why, and the one action that would move it.", cli: ["sweep"], mcp: "workspace_sweep", effect: "reads" },
  { id: "workspace.questions", summary: "Report the open questions an entity asks, or every entity's at once.", cli: ["questions"], mcp: "workspace_questions", effect: "reads" },
  { id: "workspace.validate", summary: "Validate every record in the workspace, and commit a backlog batch this promotes to defined.", cli: ["validate"], mcp: { absent: "Chat reads state through workspace_status and the entity tools; a full validation is an operator's check before a release." }, effect: "writes" },
  { id: "workspace.status", summary: "Report defined, active, review and new-observation state.", cli: ["status"], mcp: "workspace_status", effect: "reads" },
  { id: "workspace.gap", summary: "Trace accepted specification to the evidence that implements it.", cli: ["gap"], mcp: "gap_report", effect: "reads" },
  { id: "workspace.sync", summary: "Install the shipped skills and refresh the generated rules.", cli: ["sync"], mcp: { absent: TERMINAL_SETUP }, effect: "writes" },
  { id: "workspace.doctor", summary: "Report whether Kotta is reachable from where its work happens.", cli: ["doctor"], mcp: { absent: "Answers about the environment a command was typed in; a chat reaches Kotta through a server that is already running." }, effect: "reads" },

  // The parameterised families: one declaration, one command and one tool per entity. They come
  // first inside every entity group because that is where orientation belongs.
  { id: "entity.list", summary: "List every entity of a kind with its state and title.", cli: ["{entity}", "list"], mcp: "{entity}_list", family: true, effect: "reads" },
  { id: "entity.show", summary: "Read one entity as it is stored.", cli: ["{entity}", "show"], mcp: "{entity}_show", family: true, effect: "reads" },

  // Task lifecycle.
  { id: "task.create", summary: "Capture intent as a backlog task.", cli: ["task", "new"], mcp: "task_create", effect: "writes" },
  { id: "task.validate", summary: "Validate one task against its form and coverage.", cli: ["task", "validate"], mcp: "task_validate", effect: "reads" },
  { id: "task.define", summary: "Apply a definition, or amend a capture with --draft.", cli: ["task", "define"], mcp: "task_define", effect: "writes" },
  { id: "task.start", summary: "Claim a defined task, with --caller keeping the caller's context.", cli: ["task", "start"], mcp: "task_start_caller", effect: "writes" },
  { id: "task.execute", summary: "Start a task and launch a fresh agent context from its brief.", cli: ["task", "execute"], mcp: { absent: "Launches an agent process; a chat that could spawn its own successor would escape the brief boundary." }, effect: "writes" },
  { id: "task.submit-review", summary: "Submit an implemented task with acceptance-to-evidence mapping.", cli: ["task", "review"], mcp: "task_submit_review", effect: "writes" },
  { id: "task.close", summary: "Close an accepted and integrated task.", cli: ["task", "close"], mcp: { absent: CHAT_GATED }, effect: "writes" },
  { id: "task.cancel", summary: "Retire work whose purpose is gone, with a reason.", cli: ["task", "cancel"], mcp: { absent: CHAT_GATED }, effect: "writes" },
  { id: "task.brief", summary: "Assemble the minimal execution context for one task.", cli: ["task", "brief"], mcp: "task_brief", effect: "reads" },
  { id: "task.reopen", summary: "Return a reviewed or terminal task to work.", cli: ["task", "reopen"], mcp: { absent: CHAT_GATED }, effect: "writes" },
  { id: "task.settle-deviation", summary: "Record that a declared deviation left nothing behind, with the reason.", cli: ["task", "settle"], mcp: "task_settle_deviation", effect: "writes" },
  { id: "task.message-record", summary: "Persist one visible chat message against a task.", cli: { absent: "Records what was said in a chat; there is no terminal conversation to record." }, mcp: "task_message_record", effect: "writes" },

  // Observations.
  { id: "observation.create", summary: "Capture something noticed, with evidence.", cli: ["observation", "new"], mcp: "observation_create", effect: "writes" },
  { id: "observation.validate", summary: "Check an observation's sections and find duplicates.", cli: ["observation", "validate"], mcp: { absent: "Preparation for the disposition, which is itself gated through approval_request." }, effect: "reads" },
  { id: "observation.link", summary: "Record the task an existing observation was discovered during.", cli: ["observation", "link"], mcp: "observation_link", effect: "writes" },
  { id: "observation.resolve", summary: "Disposition an observation.", cli: ["observation", "resolve"], mcp: { absent: CHAT_GATED }, effect: "writes" },

  // Specification. Shaping has no lifecycle: a node is drafted, then landed on a human yes.
  { id: "spec.create", summary: "Mint and scaffold a specification node from its registered form.", cli: ["spec", "new"], mcp: "spec_create", effect: "writes" },

  // Decisions.
  { id: "decision.create", summary: "Publish a durable human decision.", cli: ["decision", "create"], mcp: { absent: CHAT_GATED }, effect: "writes" },

  // Batches.
  { id: "batch.create", summary: "Create a batch.", cli: ["batch", "new"], mcp: { absent: BATCH_SHAPING }, effect: "writes" },
  { id: "batch.add", summary: "Add a task or a child batch to a batch.", cli: ["batch", "add"], mcp: { absent: BATCH_SHAPING }, effect: "writes" },
  { id: "batch.remove", summary: "Remove a member from a batch.", cli: ["batch", "remove"], mcp: { absent: BATCH_SHAPING }, effect: "writes" },
  { id: "batch.validate", summary: "Validate a batch and plan its dependency waves, defining and committing one that validates from backlog.", cli: ["batch", "validate"], mcp: { absent: BATCH_SHAPING }, effect: "writes" },
  { id: "batch.start", summary: "Dispatch the next wave on the coordinator branch.", cli: ["batch", "start"], mcp: { absent: "Launches agent processes for a whole wave." }, effect: "writes" },
  { id: "batch.status", summary: "Report a batch subtree and its coordinator state.", cli: ["batch", "status"], mcp: { absent: "The board and batch_show answer the same question for a reader." }, effect: "reads" },
  { id: "batch.close", summary: "Complete a batch whose members all reached done.", cli: ["batch", "close"], mcp: { absent: CHAT_GATED }, effect: "writes" },
  { id: "batch.finalize", summary: "Clean up a done batch's coordinator branch.", cli: ["batch", "finalize"], mcp: { absent: "Deletes branches and worktrees after proving integration; an operator's cleanup." }, effect: "writes" },

  // Claims.
  { id: "claim.list", summary: "List execution claims and where they are held.", cli: ["claim", "list"], mcp: { absent: TERMINAL_RECOVERY }, effect: "reads" },
  { id: "claim.release", summary: "Release a claim and return the task to defined.", cli: ["claim", "release"], mcp: { absent: TERMINAL_RECOVERY }, effect: "writes" },

  // Host wiring and the servers, which close the terminal surface.
  { id: "workspace.integrate", summary: "Write the project-scoped MCP configuration for a host.", cli: ["integrate"], mcp: { absent: "Configures the very server a chat would call it through." }, effect: "writes" },
  { id: "workspace.serve-mcp", summary: "Serve the MCP tool surface over stdio.", cli: ["mcp"], mcp: { absent: "This is the server itself." }, effect: "writes" },
  { id: "workspace.board", summary: "Serve the read-only board.", cli: ["ui"], mcp: { absent: "A local server an operator opens in a browser; the board is a view, not an operation." }, effect: "writes" },

  // The chat's own gate.
  { id: "approval.request", summary: "Put a gated decision to the human and apply what they answer.", cli: { absent: "The terminal's approval is the operator typing --approve on the operation itself." }, mcp: "approval_request", effect: "writes" },
];

/** True when the surface carries the operation; the alternative is a stated reason. */
export function exposed<T>(exposure: Exposure<T>): exposure is T {
  return !(typeof exposure === "object" && exposure !== null && "absent" in exposure);
}

export interface ExpandedOperation {
  readonly id: string;
  readonly entity: FamilyEntity | null;
  readonly cli: readonly string[] | null;
  readonly mcp: string | null;
  readonly summary: string;
  readonly effect: OperationEffect;
}

/**
 * The declaration as the surfaces see it: families expanded over their entities, every name
 * resolved. Totality is asserted against this — the expanded set, never a count of declarations.
 */
export function expandOperations(declarations: readonly OperationDeclaration[] = OPERATIONS): ExpandedOperation[] {
  return declarations.flatMap((declaration) => {
    const resolve = (entity: FamilyEntity | null) => ({
      id: entity ? `${entity}.${declaration.id.split(".")[1]}` : declaration.id,
      entity,
      cli: exposed(declaration.cli) ? declaration.cli.map((segment) => segment.replace("{entity}", entity ?? "")) : null,
      mcp: exposed(declaration.mcp) ? declaration.mcp.replace("{entity}", entity ?? "") : null,
      summary: declaration.summary,
      effect: declaration.effect,
    });
    return declaration.family ? FAMILY_ENTITIES.map((entity) => resolve(entity)) : [resolve(null)];
  });
}

/** Every CLI path the declaration promises, as space-joined command paths. */
export function declaredCliCommands(): string[] {
  return expandOperations().flatMap((operation) => (operation.cli ? [operation.cli.join(" ")] : [])).sort();
}

/** Every MCP tool name the declaration promises. */
export function declaredMcpTools(): string[] {
  return expandOperations().flatMap((operation) => (operation.mcp ? [operation.mcp] : [])).sort();
}
