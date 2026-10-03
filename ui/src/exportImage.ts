/* ══ A drawn diagram, taken away ════════════════════════
   Every diagram can be copied or saved as SVG or PNG. The SVG is the drawing's own vector source;
   the PNG is that same SVG rasterised at twice its size, with the board's font embedded so the
   picture reads as the page does (without a network it falls back to the system font). */

const FONT_CSS = "https://fonts.googleapis.com/css2?family=Archivo:wght@400;600&display=swap";
let fontFaces: Promise<string> | null = null;

/** The board's font as `@font-face` rules with the font files inlined; empty when it cannot be fetched. */
function embeddedFont(): Promise<string> {
  fontFaces ??= (async () => {
    const css = await (await fetch(FONT_CSS)).text();
    const urls = [...new Set([...css.matchAll(/url\((https:[^)]+)\)/g)].map((match) => match[1]))];
    const inlined = new Map(await Promise.all(urls.map(async (url) => {
      const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return [url, `data:font/woff2;base64,${btoa(binary)}`] as const;
    })));
    return css.replace(/url\((https:[^)]+)\)/g, (_, url: string) => `url(${inlined.get(url) ?? url})`);
  })().catch(() => "");
  return fontFaces;
}

/** The size an SVG declares, by its viewBox. */
function svgSize(svg: string): { width: number; height: number } {
  const box = /viewBox="\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*"/.exec(svg);
  return box ? { width: Number(box[1]), height: Number(box[2]) } : { width: 800, height: 600 };
}

/** The SVG with an explicit size and the embedded font, ready to be drawn as an image. */
async function standalone(svg: string, width: number, height: number): Promise<string> {
  const font = await embeddedFont();
  let sized = svg.replace(/<svg\b([^>]*)>/, (_, attributes: string) => {
    const kept = attributes.replace(/\s(?:width|height|style)="[^"]*"/g, "");
    return `<svg${kept} width="${width}" height="${height}">`;
  });
  if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(sized)) sized = sized.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  return font ? sized.replace(/(<svg\b[^>]*>)/, `$1<style>${font}</style>`) : sized;
}

export async function svgToPng(svg: string, background: string, scale = 2): Promise<Blob> {
  const { width, height } = svgSize(svg);
  const source = await standalone(svg, width, height);
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const context = canvas.getContext("2d")!;
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The canvas gave no PNG."))), "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Copies a PNG; the promise form keeps Safari's user-gesture rule. */
export async function copyPng(png: Promise<Blob>): Promise<void> {
  await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
}
export async function copySvg(svg: string): Promise<void> {
  await navigator.clipboard.writeText(svg);
}
export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function fileName(label: string, extension: string): string {
  const slug = label.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${slug || "diagram"}.${extension}`;
}
