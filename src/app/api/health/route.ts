import { NextResponse } from "next/server";
import { one } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe for the platform and for verifying that the
 * DATABASE_URL secret is wired up. Reports reachability only — no data.
 */
export async function GET() {
  try {
    const row = one<{ ok: number }>("SELECT 1 as ok");
    return NextResponse.json(
      { ok: row?.ok === 1, database: "reachable" },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "unreachable",
        error: error instanceof Error ? error.message : "unknown error",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
