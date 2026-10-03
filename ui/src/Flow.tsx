import { useEffect, useMemo, useState } from "react";
import {
  BaseEdge, Controls, EdgeLabelRenderer, Handle, MarkerType, Position, ReactFlow,
  type Edge, type EdgeProps, type Node, type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import ELK, { type ElkLabel, type ElkNode, type ElkPoint } from "elkjs/lib/elk.bundled.js";
import { DiagramActions, token } from "./Diagram";
import type { FlowEdge, FlowGraph, FlowNode } from "./model";

/* ══ The drawn renderer: React Flow, laid out by ELK ═══
   Every node is the board's own markup, so it carries the board's tokens and provenance frames; ELK
   places the nodes and routes every edge orthogonally, and each edge is drawn along ELK's own bend
   points rather than re-routed by React Flow. Loaded only when a view draws with it.
   Keeps BR-01m414skfbftb3zv6z2f1tzzsq (the board draws its own diagrams). */

const MAX_WIDTH: Partial<Record<FlowNode["shape"], number>> = { "use-case": 280, actor: 200, goal: 220 };
const DEFAULT_MAX = 200;
const PAD = 28;
const LINE = 18;
const CAPTION = 14;
const FONT = "600 13.5px Archivo, system-ui, sans-serif";
const LABEL_FONT = "11.5px Archivo, system-ui, sans-serif";

/** A text's drawn width in a given font; a rough estimate where no canvas exists. */
let measure: CanvasRenderingContext2D | null | undefined;
function textWidth(text: string, font: string): number {
  if (measure === undefined) measure = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;
  if (!measure) return text.length * 8;
  measure.font = font;
  return measure.measureText(text).width;
}

/** A box as wide as its label, up to a limit past which the label wraps; markers are fixed. */
function sizeOf(node: FlowNode): { width: number; height: number } {
  if (node.shape === "start") return { width: 18, height: 18 };
  if (node.shape === "end") return { width: 22, height: 22 };
  const pad = node.shape === "use-case" ? PAD + 16 : PAD;
  const max = MAX_WIDTH[node.shape] ?? DEFAULT_MAX;
  const natural = Math.ceil(textWidth(node.label, FONT)) + pad;
  const width = Math.min(max, Math.max(72, natural));
  const lines = natural <= max ? 1 : Math.ceil((natural - pad) / (max - pad));
  return { width, height: 14 + LINE * lines + (node.caption ? CAPTION : 0) };
}

type CardData = { node: FlowNode; lit: boolean | null };
type GroupData = { label: string };
type RouteData = { points: ElkPoint[]; lit: boolean | null; label?: ElkLabel; title?: string };

function FlowCard({ data }: NodeProps<Node<CardData>>) {
  const { node, lit } = data;
  const classes = ["flow-node", `flow-node--${node.shape}`, node.level ? `prov-card-${node.level}` : "", node.terminal ? "is-terminal" : "",
    node.opens ? "is-open" : "", node.dimmed ? "is-dimmed" : "", lit === false ? "is-faded" : "", lit ? "is-lit" : ""];
  const marker = node.shape === "start" || node.shape === "end";
  return <div className={classes.filter(Boolean).join(" ")} title={marker ? node.label : undefined}>
    <Handle type="target" position={Position.Top} isConnectable={false} />
    {!marker && <span className="flow-node__label">{node.label}</span>}
    {!marker && node.caption && <span className="flow-node__caption">{node.caption}</span>}
    <Handle type="source" position={Position.Bottom} isConnectable={false} />
  </div>;
}

function FlowGroup({ data }: NodeProps<Node<GroupData>>) {
  return <div className="flow-group"><span className="flow-group__label">{data.label}</span></div>;
}

/** A path through ELK's bend points, each corner rounded. */
function roundedPath(points: ElkPoint[], radius = 8): string {
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [a, b, c] = [points[i - 1], points[i], points[i + 1]];
    const r = Math.min(radius, Math.hypot(b.x - a.x, b.y - a.y) / 2, Math.hypot(c.x - b.x, c.y - b.y) / 2);
    const inX = b.x + Math.sign(a.x - b.x) * r, inY = b.y + Math.sign(a.y - b.y) * r;
    const outX = b.x + Math.sign(c.x - b.x) * r, outY = b.y + Math.sign(c.y - b.y) * r;
    path += ` L ${inX} ${inY} Q ${b.x} ${b.y} ${outX} ${outY}`;
  }
  const last = points[points.length - 1];
  return `${path} L ${last.x} ${last.y}`;
}

function RoutedEdge({ data, markerStart, markerEnd, style }: EdgeProps<Edge<RouteData>>) {
  if (!data?.points.length) return null;
  const { label } = data;
  return <>
    <BaseEdge path={roundedPath(data.points)} markerStart={markerStart} markerEnd={markerEnd}
      style={{ ...style, opacity: data.lit === false ? 0.15 : 1, strokeWidth: data.lit ? 2 : 1.25 }} />
    {label?.text && <EdgeLabelRenderer>
      <div className={`flow-label${data.lit === false ? " is-faded" : ""}`} title={data.title}
        style={{ transform: `translate(${label.x ?? 0}px, ${label.y ?? 0}px)`, width: label.width }}>{label.text}</div>
    </EdgeLabelRenderer>}
  </>;
}

/* ── The same drawing as a standalone SVG ───────────────
   Built from the layout, not captured from the page: plain rectangles, paths and text in the
   current theme's colours, so it pastes into a drawing tool as shapes that can still be edited. */
const escapeXml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A label broken into lines that fit a width, word by word. */
function wrap(text: string, width: number, font: string): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, font) > width) { lines.push(line); line = word; } else line = next;
  }
  return line ? [...lines, line] : lines;
}

function toSvg(laid: Laid): string {
  const c = {
    bg: token("--color-bg", "#f3f2f2"), surface: token("--color-surface", "#eae9e9"), text: token("--color-text", "#201e1d"),
    muted: token("--color-neutral-600", "#7d7979"), line: token("--color-neutral-400", "#bab6b6"), soft: token("--color-neutral-500", "#9b9797"),
    partly: token("--prov-partly", "#a35f00"), inferred: token("--prov-inferred", "#ae1800"),
  };
  const margin = 16;
  const width = Math.ceil(laid.width + margin * 2), height = Math.ceil(laid.height + margin * 2);
  const origin = new Map<string, { x: number; y: number }>();
  for (const node of laid.nodes) {
    const parent = node.parentId ? origin.get(node.parentId) : undefined;
    origin.set(node.id, { x: node.position.x + (parent?.x ?? margin), y: node.position.y + (parent?.y ?? margin) });
  }
  const out: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Archivo, system-ui, sans-serif">`,
    `<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c.muted}"/></marker></defs>`,
    `<rect width="${width}" height="${height}" fill="${c.bg}"/>`,
  ];
  for (const node of laid.nodes) {
    if (node.type !== "group") continue;
    const { x, y } = origin.get(node.id)!;
    const w = Number(node.style?.width ?? 0), h = Number(node.style?.height ?? 0);
    out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${c.surface}" fill-opacity=".45" stroke="${c.line}" stroke-dasharray="4 3"/>`,
      `<text x="${x + 12}" y="${y + 20}" font-size="10" letter-spacing="1" fill="${c.muted}">${escapeXml((node.data as GroupData).label.toUpperCase())}</text>`);
  }
  for (const edge of laid.edges) {
    if (!edge.points.length) continue;
    out.push(`<path d="${roundedPath(edge.points.map((p) => ({ x: p.x + margin, y: p.y + margin })))}" fill="none" stroke="${c.muted}" stroke-width="1.25"${edge.dashed ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#arrow)"${edge.both ? ' marker-start="url(#arrow)"' : ""}/>`);
    const label = edge.elkLabel;
    if (label?.text) {
      const lx = (label.x ?? 0) + margin, ly = (label.y ?? 0) + margin;
      out.push(`<rect x="${lx}" y="${ly}" width="${label.width}" height="${label.height}" fill="${c.bg}"/>`,
        `<text x="${lx + 5}" y="${ly + 13}" font-size="11.5" fill="${c.muted}">${escapeXml(label.text)}</text>`);
    }
  }
  for (const node of laid.nodes) {
    if (node.type !== "card") continue;
    const flow = (node.data as CardData).node;
    const { x, y } = origin.get(node.id)!;
    const w = node.width ?? 0, h = node.height ?? 0;
    const cx = x + w / 2;
    if (flow.shape === "start") { out.push(`<circle cx="${cx}" cy="${y + h / 2}" r="${w / 2}" fill="${c.text}"/>`); continue; }
    if (flow.shape === "end") { out.push(`<circle cx="${cx}" cy="${y + h / 2}" r="${w / 2}" fill="none" stroke="${c.text}" stroke-width="1.5"/>`, `<circle cx="${cx}" cy="${y + h / 2}" r="${w / 2 - 4}" fill="${c.text}"/>`); continue; }
    const stroke = flow.level === "partly-inferred" ? c.partly : flow.level === "inferred" ? c.inferred : flow.level === "stated" ? c.text : c.line;
    const dash = flow.level === "partly-inferred" || flow.level === "inferred" ? ' stroke-dasharray="5 3"' : "";
    const radius = { "use-case": h / 2, actor: 3, goal: 0, state: 12 }[flow.shape as string] ?? 6;
    const fill = flow.shape === "actor" ? c.bg : flow.shape === "goal" ? "none" : c.surface;
    if (flow.shape !== "condition") out.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="${flow.shape === "goal" && !flow.level ? c.soft : stroke}" stroke-width="1.5"${dash}/>`);
    if (flow.shape === "actor") out.push(`<rect x="${x}" y="${y}" width="5" height="${h}" fill="${c.text}"/>`);
    if (flow.shape === "goal") out.push(`<rect x="${x}" y="${y + h - 4}" width="${w}" height="4" fill="${c.soft}"/>`);
    if (flow.terminal) out.push(`<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="9" fill="none" stroke="${c.text}" stroke-width="1.5"/>`);
    const pad = flow.shape === "use-case" ? PAD + 16 : PAD;
    const lines = wrap(flow.label, w - pad + 2, FONT);
    const block = lines.length * LINE + (flow.caption ? CAPTION : 0);
    let ty = y + (h - block) / 2 + 13;
    const italic = flow.shape === "condition" ? ' font-style="italic"' : "";
    for (const line of lines) { out.push(`<text x="${cx}" y="${ty}" text-anchor="middle" font-size="13.5" font-weight="${flow.shape === "condition" ? 500 : 600}"${italic} fill="${flow.shape === "condition" ? c.muted : c.text}">${escapeXml(line)}</text>`); ty += LINE; }
    if (flow.caption) out.push(`<text x="${cx}" y="${ty - 3}" text-anchor="middle" font-size="10.5" fill="${c.muted}">${escapeXml(flow.caption)}</text>`);
  }
  out.push("</svg>");
  return out.join("\n");
}

const nodeTypes = { card: FlowCard, group: FlowGroup };
const edgeTypes = { routed: RoutedEdge };
const elk = new ELK();

type Laid = { nodes: Node[]; edges: Array<FlowEdge & { id: string; points: ElkPoint[]; elkLabel?: ElkLabel }>; width: number; height: number };

async function layOut(graph: FlowGraph): Promise<Laid> {
  const leaf = (node: FlowNode): ElkNode => ({ id: node.id, ...sizeOf(node) });
  const loose = graph.nodes.filter((node) => !node.group).map(leaf);
  const grouped: ElkNode[] = graph.groups.map((group) => ({
    id: group.id, labels: [{ text: group.label }],
    layoutOptions: { "elk.padding": "[top=32,left=14,bottom=14,right=14]" },
    children: graph.nodes.filter((node) => node.group === group.id).map(leaf),
  }));
  const root: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": graph.direction,
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.layered.spacing.nodeNodeBetweenLayers": graph.direction === "DOWN" ? "48" : "56",
      "elk.spacing.nodeNode": graph.direction === "DOWN" ? "24" : "12",
      "elk.spacing.edgeNode": "16",
      "elk.spacing.edgeEdge": "10",
      "elk.spacing.edgeLabel": "4",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.cycleBreaking.strategy": "GREEDY_MODEL_ORDER",
      "elk.json.edgeCoords": "ROOT",
      "elk.json.shapeCoords": "PARENT",
    },
    children: [...loose, ...grouped],
    edges: graph.edges.map((edge, index) => ({
      id: `e${index}`, sources: [edge.from], targets: [edge.to],
      labels: edge.label ? [{ text: edge.label, width: Math.ceil(textWidth(edge.label, LABEL_FONT)) + 10, height: 18 }] : undefined,
    })),
  };
  const laid = await elk.layout(root);
  const byId = new Map(graph.nodes.map((node) => [node.id, node]));
  const nodes: Node[] = [];
  const toNode = (child: ElkNode, parentId?: string): Node => ({
    id: child.id, type: "card", position: { x: child.x ?? 0, y: child.y ?? 0 }, parentId, draggable: false, selectable: false,
    width: child.width, height: child.height, data: { node: byId.get(child.id)!, lit: null } satisfies CardData,
  });
  for (const child of laid.children ?? []) {
    if (byId.has(child.id)) { nodes.push(toNode(child)); continue; }
    nodes.push({ id: child.id, type: "group", position: { x: child.x ?? 0, y: child.y ?? 0 }, draggable: false, selectable: false,
      style: { width: child.width, height: child.height }, data: { label: child.labels?.[0]?.text ?? "" } satisfies GroupData });
    for (const inner of child.children ?? []) nodes.push(toNode(inner, child.id));
  }
  const edges = (laid.edges ?? []).map((edge, index) => {
    const section = edge.sections?.[0];
    const points = section ? [section.startPoint, ...(section.bendPoints ?? []), section.endPoint] : [];
    return { ...graph.edges[index], id: edge.id, points, elkLabel: edge.labels?.[0] };
  });
  return { nodes, edges, width: laid.width ?? 0, height: laid.height ?? 0 };
}

export default function FlowDiagram({ graph, label, onOpen }: { graph: FlowGraph; label: string; onOpen?: (id: string) => void }) {
  const [laid, setLaid] = useState<Laid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setLaid(null);
    const fonts = typeof document !== "undefined" && document.fonts ? document.fonts.ready : Promise.resolve();
    fonts.then(() => layOut(graph)).then((result) => { if (live) setLaid(result); }, (reason: unknown) => { if (live) setError(String(reason)); });
    return () => { live = false; };
  }, [graph]);

  const stroke = token("--color-neutral-600", "#7d7979");
  const accent = token("--color-accent", "#ec3013");
  const { nodes, edges } = useMemo(() => {
    if (!laid) return { nodes: [], edges: [] };
    const near = new Set<string>();
    if (hovered) for (const edge of laid.edges) if (edge.from === hovered || edge.to === hovered) { near.add(edge.from); near.add(edge.to); }
    const nodes = laid.nodes.map((node) => node.type !== "card" ? node : { ...node, data: { ...(node.data as CardData), lit: hovered ? near.has(node.id) : null } });
    const edges: Edge<RouteData>[] = laid.edges.map((edge) => {
      const lit = hovered ? edge.from === hovered || edge.to === hovered : null;
      const color = lit ? accent : stroke;
      const marker = { type: MarkerType.ArrowClosed, color, width: 16, height: 16 };
      return { id: edge.id, source: edge.from, target: edge.to, type: "routed",
        data: { points: edge.points, lit, label: edge.elkLabel, title: edge.title },
        style: { stroke: color, strokeDasharray: edge.dashed ? "5 4" : undefined }, markerEnd: marker, markerStart: edge.both ? marker : undefined };
    });
    return { nodes, edges };
  }, [laid, hovered, stroke, accent]);

  if (error) return <p className="diagram__failed" role="alert">The diagram could not be laid out ({error}).</p>;
  if (!laid) return <p className="diagram__drawing" role="status">Drawing {label.toLowerCase()}…</p>;
  return <>
    <div className="flow" role="img" aria-label={label} style={{ height: Math.min(Math.max(laid.height + 96, 200), 900) }}>
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
      fitView fitViewOptions={{ padding: { top: "56px", right: "24px", bottom: "24px", left: "24px" }, maxZoom: 1, minZoom: 0.5 }} minZoom={0.2} maxZoom={2}
      nodesConnectable={false} nodesDraggable={false} elementsSelectable={false}
      panOnScroll zoomOnScroll={false} proOptions={{ hideAttribution: true }}
      onNodeClick={(_, node) => { const opens = (node.data as CardData).node?.opens; if (opens && onOpen) onOpen(opens); }}
      onNodeMouseEnter={(_, node) => { if (node.type === "card") setHovered(node.id); }}
      onNodeMouseLeave={() => setHovered(null)}>
      <Controls position="top-right" orientation="horizontal" showInteractive={false} />
    </ReactFlow>
    </div>
    <DiagramActions label={label} svg={() => toSvg(laid)} />
  </>;
}
