import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import { fileURLToPath } from "url";
import { compileRangerWithFlags } from "./helpers/compiler";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT_DIR, "tests", ".output");

// The port the fixture calls `start` with. `start` takes it as an argument, so
// the test cannot choose it at run time.
const PORT = 8788;
const BASE = `http://127.0.0.1:${PORT}`;

async function waitForServer(timeoutMs = 10000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(BASE + "/", { signal: AbortSignal.timeout(500) });
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
  throw new Error(`server did not come up on ${BASE}`);
}

// ISSUES.md #93. `start server <port>` used to emit `server.start(port)` on
// es6 -- a call to a method nothing generated -- so every Ranger HTTP server
// compiled cleanly, printed its startup line and died on the next statement.
// A codegen assertion would not have caught it: the emitted text looked
// perfectly reasonable. So this test RUNS the server.
describe("HTTP server, es6", () => {
  let server: ChildProcess | undefined;

  beforeAll(async () => {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    const result = compileRangerWithFlags(
      "./tests/fixtures/http_server_routes.rgr",
      "es6",
      OUTPUT_DIR
    );
    expect(
      result.success,
      `Compile failed: ${result.error || result.output}`
    ).toBe(true);

    const jsFile = path.join(OUTPUT_DIR, "http_server_routes.js");
    expect(fs.existsSync(jsFile), `Missing output: ${jsFile}`).toBe(true);

    server = spawn(process.execPath, [jsFile], { stdio: "ignore" });
    await waitForServer();
  }, 40000);

  afterAll(() => {
    server?.kill();
  });

  it("routes a GET, and reads the method and path", async () => {
    const res = await fetch(BASE + "/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain");
    expect(await res.text()).toBe("GET /");
  });

  it("reads a {name} path parameter, as Go's ServeMux does", async () => {
    const res = await fetch(BASE + "/users/42");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("user=42");
  });

  it("reads a query parameter, and the path excludes the query string", async () => {
    const res = await fetch(BASE + "/search?q=ranger");
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("q=ranger");
  });

  it("reads a request header", async () => {
    const res = await fetch(BASE + "/echo", { headers: { "x-demo": "yes" } });
    expect(await res.text()).toBe("x-demo=yes");
  });

  it("answers 404 for an unknown path", async () => {
    const res = await fetch(BASE + "/nope");
    expect(res.status).toBe(404);
  });

  it("answers 405 when the path matches and the verb does not", async () => {
    // Not 404: the distinction the Go writer makes, so the adapter makes it too.
    const res = await fetch(BASE + "/search", { method: "POST" });
    expect(res.status).toBe(405);
  });

  it("streams server-sent events with the right framing", async () => {
    const res = await fetch(BASE + "/events", {
      signal: AbortSignal.timeout(3000),
    });
    expect(res.headers.get("content-type")).toBe("text/event-stream");

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let text = "";
    // The handler sends two events and returns; the connection stays open, as
    // SSE connections do, so read until both have arrived rather than to EOF.
    while (!text.includes("data: two")) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    await reader.cancel();

    expect(text).toContain("event: hello\ndata: one\n\n");
    expect(text).toContain("event: hello\ndata: two\n\n");
  });
});
