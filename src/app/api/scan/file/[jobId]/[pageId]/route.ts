import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { getScanJob } from "@/lib/db";
import { pageFilePath } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string; pageId: string }> },
) {
  const user = await currentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { jobId, pageId } = await params;
  const job = getScanJob(jobId, user.id);
  if (!job) return new NextResponse("Not found", { status: 404 });
  const page = job.pages.find((p) => p.id === pageId);
  if (!page) return new NextResponse("Not found", { status: 404 });

  try {
    const data = await readFile(pageFilePath(job.id, page.path));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": page.mime,
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": `inline; filename="${encodeURIComponent(page.name)}"`,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("File missing", { status: 410 });
  }
}
