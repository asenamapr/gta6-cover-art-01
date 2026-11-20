// Dev-only static file server for the app/ folder.
//
// Run it with `node serve.ts` (defaults to port 8080) or pass
// `--port <number>` to pick another one. It only ever serves files
// that live under app/, only answers GET and HEAD, and only binds
// the loopback interface, so it is handy while iterating locally
// and useless as a public server. Node 22 standard library only.
import { createReadStream, statSync } from "node:fs";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = resolve(fileURLToPath(new URL("./app", import.meta.url)));
const DEFAULT_PORT = 8080;
const FALLBACK_TYPE = "application/octet-stream";

// Extension (lowercase, with the leading dot) -> Content-Type.
const TYPES = new Map<string, string>([
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"],
  [".woff", "font/woff"],
  [".ttf", "font/ttf"],
  [".otf", "font/otf"],
  [".bin", FALLBACK_TYPE],
  [".wasm", "application/wasm"],
  [".wav", "audio/wav"],
  [".mp3", "audio/mpeg"],
  [".ogg", "audio/ogg"],
  [".txt", "text/plain; charset=utf-8"],
]);

function typeFor(filePath: string): string {
  return TYPES.get(extname(filePath).toLowerCase()) ?? FALLBACK_TYPE;
}

// Reads `--port <n>` out of argv; anything missing, non-numeric or
// out of range falls back to the default port.
function pickPort(argv: string[]): number {
  const flagAt = argv.indexOf("--port");
  if (flagAt === -1) return DEFAULT_PORT;
  const wanted = Number(argv[flagAt + 1]);
  const usable =
    Number.isInteger(wanted) && wanted > 0 && wanted < 65536;
  return usable ? wanted : DEFAULT_PORT;
}

function replyText(
  res: ServerResponse,
  status: number,
  body: string,
): void {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(body);
}

// True when `candidate` is APP_ROOT itself or lives underneath it.
// Any path that climbs out (a ".." that escapes the root) fails here.
function staysInside(candidate: string): boolean {
  const rel = relative(APP_ROOT, candidate);
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${"/"}`));
}

function handle(req: IncomingMessage, res: ServerResponse): void {
  const method = req.method ?? "";
  if (method !== "GET" && method !== "HEAD") {
    replyText(res, 405, "method not allowed");
    return;
  }

  const rawPath = new URL(req.url ?? "/", "http://127.0.0.1").pathname;
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    replyText(res, 400, "bad request");
    return;
  }
  if (decoded.endsWith("/")) decoded += "index.html";

  // Resolve against the root without collapsing ".." away first, so
  // a traversal that climbs out of app/ is caught by staysInside
  // instead of silently landing back inside it.
  const target = resolve(APP_ROOT, `.${decoded}`);
  if (!staysInside(target)) {
    replyText(res, 403, "forbidden");
    return;
  }

  let bytes: number;
  try {
    const info = statSync(target);
    if (!info.isFile()) throw new Error("not a regular file");
    bytes = info.size;
  } catch {
    replyText(res, 404, "not found");
    return;
  }

  res.writeHead(200, {
    "content-type": typeFor(target),
    "content-length": bytes,
    "cache-control": "no-store",
  });
  if (method === "HEAD") {
    res.end();
    return;
  }
  const stream = createReadStream(target);
  stream.on("error", () => res.destroy());
  stream.pipe(res);
}

const port = pickPort(process.argv.slice(2));
createServer(handle).listen(port, "127.0.0.1", () => {
  console.log(`Serving app/ at http://localhost:${port}/`);
});
