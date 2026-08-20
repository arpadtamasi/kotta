import { appendEvent, type KottaEvent } from "../core/events.js";
import { TASK_ID } from "../core/identity.js";
import { findTask } from "../filesystem/entities.js";
import { findRepositoryRoot } from "../filesystem/workspace.js";
import { commitControlState, withControlPlaneMutation } from "../git/control-plane.js";

export function recordTaskMessage(options: {
  task: string;
  role: "human" | "assistant";
  text: string;
  clientEventId?: string;
  threadId?: string;
}, repositoryRoot?: string): { ok: true; command: "conversation record"; data: { event: KottaEvent; created: boolean } } {
  if (!TASK_ID.test(options.task)) throw new Error("A valid task id is required.");
  if (!options.text.trim()) throw new Error("Visible message text is required.");
  return withControlPlaneMutation(repositoryRoot ?? findRepositoryRoot(), (root) => {
    findTask(root, options.task);
    const result = appendEvent(root, {
      entity: options.task,
      task: options.task,
      kind: "message",
      role: options.role,
      text: options.text.trim(),
      client_event_id: options.clientEventId ?? null,
      thread_id: options.threadId ?? null,
    });
    if (result.created) commitControlState(root, `chore(kotta): record ${options.role} message for ${options.task}`);
    return { ok: true, command: "conversation record", data: { event: result.event, created: result.created } };
  }, { requireClean: false });
}
