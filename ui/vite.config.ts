import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

/**
 * The board draws two Mermaid diagram types: flowcharts and stateDiagram-v2, laid out by dagre.
 * Mermaid loads every other diagram type, layout engine and KaTeX lazily, and only when a source
 * asks for one — which no source the board builds ever does. Those modules are replaced by a stub
 * here so the published package does not carry megabytes it never loads. A source that did ask for
 * one fails to draw, and the board then shows the source and the node list, as for any failure.
 */
const UNUSED_MERMAID = /(?:\/(?!flowDiagram-|stateDiagram-v2-)[^/]*(?:diagram|definition)[^/]*|\/(?:cose-bilkent|elk|swimlanes)-[A-Z0-9]+)\.mjs$/i;
const STUB = "\0kotta-mermaid-unused";
function mermaidDiagramsWeDraw(): Plugin {
  return {
    name: "kotta-mermaid-diagrams-we-draw",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer || !importer.includes("/node_modules/mermaid/")) return null;
      return source === "katex" || UNUSED_MERMAID.test(source) ? `${STUB}:${source.split("/").pop()}` : null;
    },
    load(id) {
      if (!id.startsWith(`${STUB}:`)) return null;
      const name = JSON.stringify(id.slice(STUB.length + 1));
      return `const unused = () => { throw new Error("Mermaid's " + ${name} + " is not bundled with the Kotta board."); };\n`
        + "export default { render: unused, renderToString: unused };\nexport const diagram = undefined;\nexport const render = unused;\n";
    },
  };
}

export default defineConfig({
  root: resolve(import.meta.dirname),
  plugins: [react(), mermaidDiagramsWeDraw()],
  build: { outDir: resolve(import.meta.dirname, "../ui-dist"), emptyOutDir: true, chunkSizeWarningLimit: 800 },
});
