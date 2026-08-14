export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cached_input_tokens?: number;
}

export interface NormalizedAgentOutput {
  report: string;
  usage: TokenUsage | null;
}

function token(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

function usageFrom(value: unknown, agent: string): TokenUsage | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const directInput = token(raw.input_tokens);
  const output = token(raw.output_tokens);
  if (directInput === null || output === null) return null;

  const cacheRead = token(raw.cached_input_tokens ?? raw.cache_read_input_tokens) ?? 0;
  const cacheCreation = token(raw.cache_creation_input_tokens) ?? 0;
  // Codex reports cached input as a subset of input_tokens. Claude reports its
  // cache buckets beside input_tokens, so those buckets belong in its input total.
  const input = agent === "claude" ? directInput + cacheRead + cacheCreation : directInput;
  const authoritativeTotal = token(raw.total_tokens);
  const usage: TokenUsage = {
    input_tokens: input,
    output_tokens: output,
    total_tokens: authoritativeTotal ?? input + output,
  };
  if (cacheRead > 0) usage.cached_input_tokens = cacheRead;
  return usage;
}

function readableResult(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") return JSON.stringify(value, null, 2);
  return null;
}

function claudeOutput(stdout: string): NormalizedAgentOutput | null {
  try {
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    const report = readableResult(parsed.result);
    if (!report) return null;
    return { report, usage: usageFrom(parsed.usage, "claude") };
  } catch {
    return null;
  }
}

function codexOutput(stdout: string): NormalizedAgentOutput | null {
  const events: Array<Record<string, unknown>> = [];
  for (const line of stdout.split("\n").map((part) => part.trim()).filter(Boolean)) {
    try { events.push(JSON.parse(line) as Record<string, unknown>); }
    catch { return null; }
  }
  if (!events.length) return null;

  const completed = [...events].reverse().find((event) => event.type === "turn.completed" && event.usage);
  const messages = events.flatMap((event) => {
    const item = event.item && typeof event.item === "object" ? event.item as Record<string, unknown> : null;
    if (event.type === "item.completed" && item?.type === "agent_message") return [readableResult(item.text)];
    return [];
  }).filter((message): message is string => Boolean(message));
  const report = messages.at(-1);
  if (!report) return null;
  return { report, usage: usageFrom(completed?.usage, "codex") };
}

/**
 * Strip an adapter's machine envelope while retaining the human report and a
 * small, stable usage record. Unknown/custom output stays readable and simply
 * has no usage — Kotta never guesses accounting from prose.
 */
export function normalizeAgentOutput(agent: string, stdout: string): NormalizedAgentOutput {
  const structured = agent === "claude" ? claudeOutput(stdout) : agent === "codex" ? codexOutput(stdout) : null;
  return structured ?? { report: stdout, usage: null };
}
