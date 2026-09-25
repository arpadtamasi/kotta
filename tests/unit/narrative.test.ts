import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { agentMove, offeredOptions, pickedOption, recommendedOption, replyKind } from "../../src/conversation/distill.js";
import { redact } from "../../src/conversation/redact.js";
import { detectFormat, readSession } from "../../src/conversation/sessions.js";

/**
 * The narrative distillate's parts on their own: which lines of a session log are the conversation,
 * how a reply stands to the proposal before it, and what the secret filter removes and leaves.
 */

const CLAUDE = resolve("tests/fixtures/sessions/claude-code.jsonl");
const CODEX = resolve("tests/fixtures/sessions/codex.jsonl");

describe("reading session logs", () => {
  it("recognises the format from the content, not the file name", () => {
    expect(detectFormat([{ type: "user", message: { role: "user", content: "x" } }])).toBe("claude-code");
    expect(detectFormat([{ type: "session_meta", payload: {} }, { type: "response_item", payload: { type: "message" } }])).toBe("codex");
    expect(detectFormat([{ type: "something-else" }])).toBeUndefined();
  });

  it("keeps a Claude Code session's human and agent text, and counts what it left out by reason", () => {
    const session = readSession(CLAUDE);
    expect(session.format).toBe("claude-code");
    expect(session.utterances.map((utterance) => `${utterance.speaker}:${utterance.text.slice(0, 12).trim()}`)).toEqual([
      "human:Szeretném, h", "agent:Két út van:", "human:b", "agent:Javaslom, ho", "human:igen",
      "agent:Hány másodpe", "human:Soha, a szün", "agent:Megcsináljam", "human:hmm, előbb n",
    ]);
    expect(session.skipped).toEqual({ tool: 3, system: 1, sidechain: 1, meta: 1, interrupted: 1, paste: 1, command: 1 });
  });

  it("keeps a Codex session's request without the IDE context, and skips instructions, environment and images", () => {
    const session = readSession(CODEX);
    expect(session.format).toBe("codex");
    expect(session.utterances[0]).toEqual({ speaker: "human", timestamp: "2026-09-21T09:01:00.000Z", text: expect.stringMatching(/^Add an export button to the report page\./) });
    expect(session.utterances.map((utterance) => utterance.speaker).join(" ")).toBe("human agent human agent human agent human");
    expect(session.skipped).toMatchObject({ system: 3, tool: 3, image: 1 });
  });

  it("drops everything before --since, and counts it", () => {
    const session = readSession(CLAUDE, new Date("2026-09-20T10:05:00Z"));
    expect(session.utterances[0].text).toMatch(/^Javaslom/);
    expect(session.skipped.since).toBe(3);
  });
});

describe("pairing a reply with the proposal before it", () => {
  it("tells a proposal from a question from a report", () => {
    expect(agentMove("Javaslom, hogy maradjon. Mehet?")).toBe("proposal");
    expect(agentMove("Should I start with CSV?")).toBe("proposal");
    expect(agentMove("a) egy\nb) kettő\n\nMelyik?")).toBe("proposal");
    expect(agentMove("Hány másodperc után járjon le?")).toBe("question");
    expect(agentMove("Kész, a tesztek zöldek.")).toBe("statement");
    expect(agentMove("```\nwhat?\n```\nKész.")).toBe("statement");
  });

  it("reads a one-word yes as a yes, and a hedge as unclear rather than a yes", () => {
    for (const reply of ["igen", "Mehet.", "ok, mehet", "yes", "rendben, köszi", "mehet ahogy egyszerűbb"]) expect(replyKind(reply)).toBe("approve");
    for (const reply of ["nem", "no, PDF first", "inkább a másik", "ne csináld"]) expect(replyKind(reply)).toBe("reject");
    for (const reply of ["igen, de előbb a teszt", "hmm, előbb nézzük meg a meglévőket", "takarítsd"]) expect(replyKind(reply)).toBe("unclear");
  });

  it("reads a pick among offered options and the option the agent recommended", () => {
    const text = "a) menüből\nb) külön gomb\n\nAz a) változatot ajánlom. Melyik legyen?";
    expect(offeredOptions(text)).toEqual(["a", "b"]);
    expect(recommendedOption(text, ["a", "b"])).toBe("a");
    expect(recommendedOption("A) x\nB) y\n\nJavaslom a B-t.", ["a", "b"])).toBe("b");
    expect(recommendedOption("a) x\nb) y\n\na változatot ajánlom", ["a", "b"])).toBeUndefined();
    expect(pickedOption("b", ["a", "b"])).toBe("b");
    expect(pickedOption("az a, mehet", ["a", "b"])).toBe("a");
    expect(pickedOption("a tesztet is írd meg", ["a", "b"])).toBeUndefined();
    expect(pickedOption("c", ["a", "b"])).toBeUndefined();
  });
});

describe("the secret and personal-data filter", () => {
  it("removes each kind and counts it", () => {
    const { text, counts } = redact([
      "key sk-ant-api03-FAKEFAKEFAKEFAKEFAKE12", "gh gho_FAKEfakeFAKEfakeFAKEfake1234", "aws AKIAFAKEFAKEFAKEFAKE",
      "jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJmaXh0dXJlLXVzZXIifQ.c2lnbmF0dXJlLWZpeHR1cmU",
      "password: hunter2hunter2", "mail bob@example.com", "tel +36 30 123 4567 és 06-30-765-4321",
      "path /Users/alice/dev/game and /home/bob/x", "log ~/.claude/projects/-Users-alice-dev-game/a.jsonl",
    ].join("\n"));
    expect(counts).toEqual({ "api-kulcs": 1, "github-token": 1, "aws-kulcs": 1, jwt: 1, "titok-érték": 1, "e-mail": 1, telefonszám: 2, "otthoni-útvonal": 3 });
    for (const secret of ["FAKEFAKE", "gho_", "AKIA", "eyJ", "hunter2", "bob@", "123 4567", "765-4321", "alice", "/home/bob"]) expect(text).not.toContain(secret);
    expect(text).toContain("~/dev/game");
    expect(text).toContain("password: [titok-érték eltávolítva]");
  });

  it("leaves dates, times, versions, ids and hashes alone", () => {
    const plain = "2026-09-25 10:04 UTC, v1.0.0-alpha.1, T-01m19b26j3z4vc6y8ntf910j6t, commit f8366fd, port 4311, 1536x1024, +3 tests, 12 345 678";
    expect(redact(plain)).toEqual({ text: plain, counts: {} });
  });
});
