import { bareNameResolves, invocationLine, kottaInvocation } from "../core/invocation.js";

/**
 * Whether Kotta is reachable from where its work happens.
 *
 * The question a reader actually has is not "is Kotta installed" — they are running it — but "will
 * the name `kotta` mean anything in the shell an agent or a host gets". A non-interactive shell
 * loads no version manager, so the answer is often no while everything looks fine in the terminal
 * the operator typed in. Kotta answers from the environment it was handed, never from a guess.
 */
export interface DoctorResult {
  ok: boolean;
  command: "doctor";
  data: {
    invocation: string;
    interpreter: string;
    entry: string;
    bareName: string | null;
  };
  errors: Array<{ code: string; message: string; path: string }>;
}

export function doctorCommand(environment: NodeJS.ProcessEnv = process.env): DoctorResult {
  const invocation = kottaInvocation();
  const bareName = bareNameResolves(environment);
  const errors = bareName
    ? []
    : [{
        code: "BARE_NAME_UNRESOLVED",
        message: `The name 'kotta' resolves to nothing on this PATH, so a command written as 'kotta …' fails wherever this environment is the one in use — a host spawning the tool server, or an agent in a non-interactive shell. Run it as '${invocationLine(invocation)}', which is what this Kotta is; 'kotta integrate' already records that form.`,
        path: invocation.entry,
      }];
  return {
    ok: errors.length === 0,
    command: "doctor",
    data: { invocation: invocationLine(invocation), interpreter: invocation.command, entry: invocation.entry, bareName },
    errors,
  };
}
