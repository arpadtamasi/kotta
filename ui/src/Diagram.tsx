import { useEffect, useState, useSyncExternalStore, type MouseEvent } from "react";
import { DEFAULT_PALETTE, type Palette } from "./model";

/* ══ Mermaid, drawn in the page ════════════════════════
   Mermaid is loaded on first use, so the list view never pays for it, and it is initialised on
   every draw from the board's own tokens: a light or dark page gets a light or dark diagram. The
   source is always one click away under the drawing, so a diagram that fails to draw still says
   what it would have shown. */

type MermaidApi = {
  initialize(config: Record<string, unknown>): void;
  render(id: string, source: string): Promise<{ svg: string }>;
};
let loading: Promise<MermaidApi> | null = null;
function loadMermaid(): Promise<MermaidApi> {
  loading ??= import("mermaid").then((module) => module.default as unknown as MermaidApi);
  loading.catch(() => { loading = null; });
  return loading;
}

/** A token's value when it is a plain hex colour Mermaid can compute with, else the fallback. */
export function token(name: string, fallback: string): string {
  if (typeof window === "undefined" || typeof getComputedStyle !== "function") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return /^#[0-9a-f]{3,8}$/i.test(value) ? value : fallback;
}

/** The provenance strokes, from the tokens `--prov-*` the stylesheet defines for both themes. */
export function readPalette(): Palette {
  return {
    stated: token("--color-text", DEFAULT_PALETTE.stated),
    partly: token("--prov-partly", DEFAULT_PALETTE.partly),
    inferred: token("--prov-inferred", DEFAULT_PALETTE.inferred),
    muted: token("--color-neutral-500", DEFAULT_PALETTE.muted),
  };
}

/* ── Spike: which renderer draws ─────────────────────────
   `dagre` and `elk` are Mermaid's two layout engines; `flow` is the React Flow + ELK prototype,
   drawn only where a view has one. The choice lives in the address (`?renderer=`), so two tabs can
   sit side by side. */
export const RENDERERS = [
  { key: "dagre", label: "Mermaid · dagre" },
  { key: "elk", label: "Mermaid · ELK" },
  { key: "flow", label: "React Flow · ELK" },
] as const;
export type Renderer = typeof RENDERERS[number]["key"];
const listeners = new Set<() => void>();
function readRenderer(): Renderer {
  if (typeof window === "undefined") return "dagre";
  const value = new URLSearchParams(window.location.search).get("renderer");
  return RENDERERS.some((renderer) => renderer.key === value) ? value as Renderer : "dagre";
}
let current: Renderer = readRenderer();
export function setRenderer(next: Renderer) {
  current = next;
  const url = new URL(window.location.href);
  url.searchParams.set("renderer", next);
  window.history.replaceState(window.history.state, "", url);
  listeners.forEach((listener) => listener());
}
export function useRenderer(): Renderer {
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => current, () => "dagre");
}
export function RendererSwitch({ flow = false }: { flow?: boolean }) {
  const renderer = useRenderer();
  return <div className="renderer-switch" role="group" aria-label="Diagram renderer (spike)">
    <span className="renderer-switch__label">Renderer</span>
    {RENDERERS.filter((option) => flow || option.key !== "flow").map((option) => <button key={option.key} type="button"
      className={`filter ${renderer === option.key ? "is-active" : ""}`} aria-pressed={renderer === option.key}
      onClick={() => setRenderer(option.key)}>{option.label}</button>)}
  </div>;
}

let sequence = 0;
export async function renderMermaid(source: string, layout: "dagre" | "elk" = "dagre"): Promise<string> {
  const mermaid = await loadMermaid();
  const background = token("--color-bg", "#f3f2f2");
  const surface = token("--color-surface", "#eae9e9");
  const text = token("--color-text", "#201e1d");
  const line = token("--color-neutral-600", "#7d7979");
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    // dagre by default; the spike's switch asks for ELK, which Mermaid loads only when asked.
    layout,
    elk: { mergeEdges: false, nodePlacementStrategy: "NETWORK_SIMPLEX", cycleBreakingStrategy: "GREEDY_MODEL_ORDER" },
    theme: "base",
    fontFamily: "Archivo, system-ui, sans-serif",
    themeVariables: {
      background, primaryColor: surface, primaryTextColor: text, primaryBorderColor: text,
      secondaryColor: background, tertiaryColor: background, lineColor: line, textColor: text,
      clusterBkg: background, clusterBorder: line, titleColor: text, edgeLabelBackground: background,
      fontSize: "14px",
    },
  });
  sequence += 1;
  const { svg } = await mermaid.render(`kotta-diagram-${sequence}`, source);
  return svg;
}

/** Changes whenever the page switches between light and dark, so a drawn diagram follows it. */
function darkQuery(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
}
function useColorScheme(): string {
  const [scheme, setScheme] = useState(() => (darkQuery()?.matches ? "dark" : "light"));
  useEffect(() => {
    const query = darkQuery();
    if (!query) return;
    const onChange = () => setScheme(query.matches ? "dark" : "light");
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);
  return scheme;
}

/** The short id a drawn node carries in its element id (`…flowchart-U3-12`, `…state-S1-4`). */
const DRAWN_ID = /(?:^|-)(?:flowchart|state)-([A-Za-z]+\d+)-\d+$/;

export function DiagramFigure({ source, label, caption, nodes, onOpen }: {
  source: string; label: string; caption?: string;
  /** Short id → node id, so a click on a drawn node opens it. */
  nodes?: Map<string, string>; onOpen?: (id: string) => void;
}) {
  const scheme = useColorScheme();
  const layout = useRenderer() === "elk" ? "elk" : "dagre";
  const [drawn, setDrawn] = useState<{ svg?: string; error?: string }>({});
  useEffect(() => {
    let live = true;
    setDrawn({});
    renderMermaid(source, layout).then(
      (svg) => { if (live) setDrawn({ svg }); },
      (reason: unknown) => { if (live) setDrawn({ error: reason instanceof Error ? reason.message : String(reason) }); },
    );
    return () => { live = false; };
  }, [source, scheme, layout]);

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!nodes || !onOpen) return;
    for (let element = event.target as Element | null; element && element !== event.currentTarget; element = element.parentElement) {
      const match = element.id ? DRAWN_ID.exec(element.id) : null;
      const id = match ? nodes.get(match[1]) : undefined;
      if (id) { onOpen(id); return; }
    }
  };

  return <figure className="diagram">
    <div className="diagram__scroll scroll" onClick={onClick}>
      {drawn.svg
        ? <div className="diagram__svg" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: drawn.svg }} />
        : drawn.error
          ? <p className="diagram__failed" role="alert">The diagram could not be drawn ({drawn.error}). Its source is below, and the list under it holds every node.</p>
          : <p className="diagram__drawing" role="status">Drawing {label.toLowerCase()}…</p>}
    </div>
    {caption && <figcaption className="diagram__caption">{caption}</figcaption>}
    <details className="diagram__source">
      <summary>Mermaid source</summary>
      <pre>{source}</pre>
    </details>
  </figure>;
}
