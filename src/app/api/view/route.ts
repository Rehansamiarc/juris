import { NextResponse } from "next/server";
import { assertSameOrigin, currentUser } from "@/lib/auth";
import { getDocument, logActivity, one, nowIso } from "@/lib/db";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { documentId?: string } | null;
  const documentId = body?.documentId;
  if (!documentId) return NextResponse.json({ ok: false }, { status: 400 });

  const doc = getDocument(documentId);
  if (!doc || (doc.ownerId && doc.ownerId !== user.id)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const recent = one<{ createdAt: string }>(
    "SELECT created_at as \"createdAt\" FROM activities WHERE user_id = ? AND kind = 'view' AND ref_id = ? ORDER BY created_at DESC LIMIT 1",
    user.id,
    documentId,
  );
  if (!recent || Date.now() - new Date(recent.createdAt).getTime() > 10 * 60 * 1000) {
    logActivity(user.id, "view", `Read ${doc.title}`, documentId);
  }

  return NextResponse.json({ ok: true, at: nowIso() });
}
