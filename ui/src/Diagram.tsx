import { useEffect, useState, useSyncExternalStore, type MouseEvent } from "react";
import { DEFAULT_PALETTE, type Palette } from "./model";
import { copyPng, copySvg, download, fileName, svgToPng } from "./exportImage";

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

/* ── Which renderer draws ─────────────────────────────
   `flow` draws the board's own nodes with React Flow, laid out by ELK; `elk` asks Mermaid for the
   same reading, also laid out by ELK, and keeps its source one click away. The choice lives in the
   address (`?renderer=`), so two tabs can sit side by side. Keeps BR-01m414skfbftb3zv6z2f1tzzsq. */
export const RENDERERS = [
  { key: "flow", label: "React Flow · ELK" },
  { key: "elk", label: "Mermaid · ELK" },
] as const;
export type Renderer = typeof RENDERERS[number]["key"];
const listeners = new Set<() => void>();
function readRenderer(): Renderer {
  if (typeof window === "undefined") return "flow";
  const value = new URLSearchParams(window.location.search).get("renderer");
  return RENDERERS.some((renderer) => renderer.key === value) ? value as Renderer : "flow";
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
  return useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => current, () => "flow");
}
export function RendererSwitch() {
  const renderer = useRenderer();
  return <div className="renderer-switch" role="group" aria-label="Diagram renderer">
    <span className="renderer-switch__label">Renderer</span>
    {RENDERERS.map((option) => <button key={option.key} type="button"
      className={`filter ${renderer === option.key ? "is-active" : ""}`} aria-pressed={renderer === option.key}
      onClick={() => setRenderer(option.key)}>{option.label}</button>)}
  </div>;
}

let sequence = 0;
export async function renderMermaid(source: string): Promise<string> {
  const mermaid = await loadMermaid();
  const background = token("--color-bg", "#f3f2f2");
  const surface = token("--color-surface", "#eae9e9");
  const text = token("--color-text", "#201e1d");
  const line = token("--color-neutral-600", "#7d7979");
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    // ELK, which Mermaid loads only when a diagram is drawn.
    layout: "elk",
    // Labels as SVG text, not HTML in a foreignObject: a copied or saved drawing then pastes into a
    // drawing tool as text, and the browser lets it be rasterised to PNG.
    htmlLabels: false,
    flowchart: { htmlLabels: false },
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
  // With SVG-text labels Mermaid escapes the entity codes mermaidLabel writes a second time
  // (`&amp;#40;`); undo that one step so a title reads `(`, as it would in an HTML label.
  return svg.replace(/&amp;(#\d+|lt|gt|quot|amp);/g, "&$1;");
}

/** Copy or save the drawing as SVG or PNG; a short note under the buttons says how it went (BR-01m414skms7ph39bgaeap927vb). */
export function DiagramActions({ label, svg }: { label: string; svg: () => string | null }) {
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => setNote(null), 2500);
    return () => clearTimeout(timer);
  }, [note]);
  const png = () => {
    const source = svg();
    return source ? svgToPng(source, token("--color-bg", "#f3f2f2")) : Promise.reject(new Error("Nothing is drawn yet."));
  };
  const run = (done: string, action: () => Promise<void>) => {
    action().then(() => setNote(done), (reason: unknown) => setNote(`That did not work: ${reason instanceof Error ? reason.message : String(reason)}`));
  };
  return <div className="diagram-actions" role="group" aria-label={`${label}: copy or save`}>
    <button type="button" className="btn btn-secondary btn-sm" onClick={() => run("Copied as PNG.", () => copyPng(png()))}>Copy PNG</button>
    <button type="button" className="btn btn-secondary btn-sm" onClick={() => run("Copied as SVG.", async () => { const source = svg(); if (!source) throw new Error("Nothing is drawn yet."); await copySvg(source); })}>Copy SVG</button>
    <button type="button" className="btn btn-secondary btn-sm" onClick={() => run("Saved as PNG.", async () => download(await png(), fileName(label, "png")))}>Save PNG</button>
    <button type="button" className="btn btn-secondary btn-sm" onClick={() => run("Saved as SVG.", async () => { const source = svg(); if (!source) throw new Error("Nothing is drawn yet."); download(new Blob([source], { type: "image/svg+xml" }), fileName(label, "svg")); })}>Save SVG</button>
    {note && <span className="diagram-actions__note" role="status">{note}</span>}
  </div>;
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
  const [drawn, setDrawn] = useState<{ svg?: string; error?: string }>({});
  useEffect(() => {
    let live = true;
    setDrawn({});
    renderMermaid(source).then(
      (svg) => { if (live) setDrawn({ svg }); },
      (reason: unknown) => { if (live) setDrawn({ error: reason instanceof Error ? reason.message : String(reason) }); },
    );
    return () => { live = false; };
  }, [source, scheme]);

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
    {drawn.svg && <DiagramActions label={label} svg={() => drawn.svg ?? null} />}
    {caption && <figcaption className="diagram__caption">{caption}</figcaption>}
    <details className="diagram__source">
      <summary>Mermaid source</summary>
      <pre>{source}</pre>
    </details>
  </figure>;
}
