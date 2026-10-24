#!/usr/bin/env node
/**
 * Smoke test: boots a production build against a throwaway Postgres database,
 * logs in, and renders every main page. A SQL-dialect regression (something
 * SQLite tolerated but Postgres rejects) surfaces here as a 500 instead of in
 * the browser.
 *
 *   SMOKE_DATABASE_URL=postgres://... node scripts/smoke.mjs
 *
 * The target database is wiped before the run, so the script refuses to touch
 * the database the app is configured to use.
 */
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const PORT = Number(process.env.SMOKE_PORT ?? 3411);
const BASE = `http://127.0.0.1:${PORT}`;
const READY_TIMEOUT_MS = 240_000;
const SEED_TIMEOUT_MS = 300_000;

const PAGES = [
  { path: "/home", marker: /Good afternoon/i },
  { path: "/library", marker: /Library/i },
  { path: "/library?q=judgment", marker: /result/i },
  { path: "/practice", marker: /practice/i },
  { path: "/revision", marker: /revision/i },
  { path: "/profile", marker: /profile|account/i },
  { path: "/scanner", marker: /scan/i },
  { path: "/tutor", marker: /tutor|counsel|ask/i },
  { path: "/cases/compare", marker: /compare/i },
];

// Next renders app/error.tsx with HTTP 200 in production, so status alone is
// not enough: match the error card's copy as well.
const ERROR_MARKERS =
  /Something broke|The workspace hit an unexpected error|Application error|Internal Server Error|NEXT_HTTP_ERROR_FALLBACK/i;

const failures = [];
const serverLog = [];
let server;
let sql;

function fail(message) {
  failures.push(message);
  console.error(`  FAIL ${message}`);
}

function ok(message) {
  console.log(`  ok   ${message}`);
}

function readEnvFile(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (!match) continue;
    out[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
  return out;
}

function resolveDatabaseUrls() {
  const fromFile = { ...readEnvFile(".env.local"), ...readEnvFile(".env.smoke") };
  const smokeUrl = process.env.SMOKE_DATABASE_URL ?? fromFile.SMOKE_DATABASE_URL;
  const appUrl = process.env.DATABASE_URL ?? fromFile.DATABASE_URL;
  return { smokeUrl, appUrl };
}

function sameDatabase(a, b) {
  try {
    const left = new URL(a);
    const right = new URL(b);
    return (
      left.host === right.host &&
      left.pathname.replace(/^\//, "") === right.pathname.replace(/^\//, "")
    );
  } catch {
    return false;
  }
}

function sslFor(url) {
  const plaintext = /sslmode=disable/.test(url) || /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url);
  return plaintext ? false : "require";
}

async function applySchema() {
  const source = readFileSync("supabase/schema.sql", "utf8");
  const statements = source
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0 && !/^(--[^\n]*\n?)+$/.test(statement));

  // The GRANT/REVOKE lines name Supabase's Data API roles. A bare Postgres
  // instance (CI service container) has no such roles, so those statements are
  // skipped there instead of raising undefined_object.
  const [{ present }] = await sql`
    select count(*)::int as present from pg_roles where rolname in ('anon', 'authenticated')
  `;
  const hasSupabaseRoles = present === 2;

  for (const statement of statements) {
    if (!hasSupabaseRoles && /\b(anon|authenticated)\b/.test(statement)) continue;
    try {
      await sql.unsafe(statement);
    } catch (error) {
      const duplicateOrMissing = error.code === "42704" || error.code === "42710";
      if (!duplicateOrMissing) throw error;
    }
  }
}

async function resetDatabase() {
  const tables = await sql`
    select tablename from pg_tables where schemaname = 'public'
  `;
  if (tables.length === 0) return;
  const list = tables.map((row) => `"${row.tablename}"`).join(", ");
  await sql.unsafe(`truncate ${list} restart identity cascade`);
}

function startServer(databaseUrl) {
  if (!existsSync(path.join(".next", "BUILD_ID"))) {
    throw new Error("No production build found. Run `npm run build` first.");
  }
  const nextBin = path.join("node_modules", "next", "dist", "bin", "next");
  server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      APP_ORIGIN: BASE,
      NODE_ENV: "production",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const collect = (chunk) => {
    serverLog.push(chunk.toString());
    if (serverLog.length > 400) serverLog.shift();
  };
  server.stdout.on("data", collect);
  server.stderr.on("data", collect);
  server.on("exit", (code) => {
    if (code !== 0) serverLog.push(`[server exited with code ${code}]`);
  });
}

async function waitFor(fn, timeoutMs, label) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    if (server?.exitCode != null && server.exitCode !== 0) {
      throw new Error(`server exited before ${label}`);
    }
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      last = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`timed out waiting for ${label}${last ? `: ${last.message}` : ""}`);
}

async function get(pathname, cookie) {
  const response = await fetch(`${BASE}${pathname}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  const body = await response.text();
  return { status: response.status, body, location: response.headers.get("location") };
}

async function main() {
  const { smokeUrl, appUrl } = resolveDatabaseUrls();

  if (!smokeUrl) {
    console.error(
      "SMOKE_DATABASE_URL is not set.\n" +
        "Point it at a throwaway Postgres database — the run truncates every table in it.\n" +
        "  SMOKE_DATABASE_URL=postgres://user:pass@host:5432/juris_smoke?sslmode=disable npm run smoke",
    );
    process.exit(2);
  }
  if (appUrl && sameDatabase(smokeUrl, appUrl)) {
    console.error(
      "SMOKE_DATABASE_URL matches DATABASE_URL. Refusing to wipe the application database.",
    );
    process.exit(2);
  }

  console.log(`smoke: preparing ${new URL(smokeUrl).host}${new URL(smokeUrl).pathname}`);
  sql = postgres(smokeUrl, {
    ssl: sslFor(smokeUrl),
    max: 1,
    connect_timeout: 20,
    onnotice: () => {},
  });

  try {
    await applySchema();
    await resetDatabase();
    ok("schema applied and tables truncated");

    startServer(smokeUrl);
    await waitFor(async () => (await get("/login")).status === 200, READY_TIMEOUT_MS, "server readiness");
    ok("server answered /login");

    // The app seeds its demo dataset on first database access, so this is also
    // the assertion that the server is talking to *this* database.
    const seeded = await waitFor(
      async () => {
        const [row] = await sql`select count(*)::int as n from documents`;
        return row.n > 0 ? row.n : 0;
      },
      SEED_TIMEOUT_MS,
      "demo seed",
    );
    ok(`seed wrote ${seeded} documents into the test database`);

    const [user] = await sql`select id from users where email = 'demo@vidhi.app'`;
    if (!user) throw new Error("seeded demo user missing");

    const token = randomBytes(32).toString("base64url");
    const sessionId = createHash("sha256").update(token).digest("hex");
    await sql`
      insert into sessions (id, user_id, expires_at, created_at)
      values (${sessionId}, ${user.id}, ${new Date(Date.now() + 86_400_000).toISOString()}, ${new Date().toISOString()})
    `;
    const cookie = `vidhi_session=${token}`;
    ok("minted a session for the demo account");

    const signedOut = await get("/home");
    if (signedOut.status === 200) fail("signed-out /home did not redirect");
    else ok(`signed-out /home redirects (${signedOut.status})`);

    for (const page of PAGES) {
      const { status, body, location } = await get(page.path, cookie);
      const label = `GET ${page.path}`;
      if (status !== 200) {
        fail(`${label} -> ${status}${location ? ` (${location})` : ""}`);
        continue;
      }
      if (ERROR_MARKERS.test(body)) {
        fail(`${label} rendered an error boundary`);
        continue;
      }
      if (!page.marker.test(body)) {
        fail(`${label} missing expected content ${page.marker}`);
        continue;
      }
      ok(`${label} -> 200`);
    }
  } catch (error) {
    fail(error.message);
  } finally {
    server?.kill();
    await sql?.end({ timeout: 5 }).catch(() => {});
  }

  if (failures.length > 0) {
    console.error(`\nsmoke: ${failures.length} failure(s)`);
    const tail = serverLog.join("").split(/\r?\n/).slice(-30).join("\n");
    if (tail.trim()) console.error(`\n--- server log (tail) ---\n${tail}`);
    process.exit(1);
  }

  console.log("\nsmoke: all checks passed");
  process.exit(0);
}

main().catch((error) => {
  console.error(`smoke: ${error.message}`);
  server?.kill();
  process.exit(1);
});
