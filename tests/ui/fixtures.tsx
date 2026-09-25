// Shared workspace fixtures for the jsdom board tests. Node-environment tests never
// import this file — it exists so each board test can state only what it is about.
import type { SpecNode, Workspace } from "../../ui/src/App";

export function node(id: string, form: string, title: string, over: Partial<SpecNode> = {}): SpecNode {
  return {
    id, form, title, path: `.kotta/spec/${form}s/${title.toLowerCase().replaceAll(" ", "-")}-${id.slice(-8)}.md`,
    accepted: [], edges: {}, sections: { intent: "What this node promises." }, ...over,
  };
}

export function workspace(over: Partial<Workspace> = {}): Workspace {
  return { project: "kotta", workspace: "/repo/.kotta", spec: [], specForms: [], notices: [], ...over };
}
