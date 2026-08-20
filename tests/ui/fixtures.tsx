// Shared workspace fixtures for the jsdom board tests. Node-environment tests never
// import this file — it exists so each board test can state only what it is about.
import type { Workspace } from "../../ui/src/App";

type Task = Workspace["tasks"][number];
type Batch = Workspace["batches"][number];
type Observation = Workspace["observations"][number];
type Decision = NonNullable<Workspace["decisions"]>[number];

export function task(id: string, title: string, over: Partial<Task> = {}): Task {
  return {
    id, title, status: "backlog", types: ["feature"], profiles: [], priority: "medium", risk: "low",
    batch: null, depends_on: [], blocks: [], sections: {}, created_at: "2026-07-20", updated_at: "2026-07-30", ...over,
  };
}
export function batch(id: string, title: string, over: Partial<Batch> = {}): Batch {
  return { id, title, status: "backlog", kind: "batch", tasks: [], sections: { goal: "One module." }, created_at: "2026-07-10", updated_at: "2026-07-20", ...over };
}
export function observation(id: string, title: string, over: Partial<Observation> = {}): Observation {
  return {
    id, title, status: "new", observation_type: "bug", severity: "medium", confidence: "high",
    created_at: "2026-07-28", sections: { evidence: "Seen twice." }, ...over,
  };
}
export function decision(id: string, title: string, over: Partial<Decision> = {}): Decision {
  return { id, title, date: "2026-07-26", sections: { decision: "The directory is the state." }, ...over };
}

export function workspace(over: Partial<Workspace> = {}): Workspace {
  return {
    project: "kotta", workspace: "/repo/.kotta", migration: null,
    tasks: [], batches: [], observations: [], decisions: [], diagnostics: [], ...over,
  };
}
