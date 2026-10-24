import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteCaseForm, EditBriefForm } from "@/components/edit-brief-form";
import { Icon } from "@/components/icons";
import { PageHeader } from "@/components/ui";
import { requireSession } from "@/lib/auth";
import { getDocument } from "@/lib/db";

export const metadata: Metadata = { title: "Edit case brief" };

export default async function EditCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = await requireSession();
  const { id } = await params;
  const doc = getDocument(id);
  if (!doc || !doc.brief) notFound();
  if (doc.ownerId !== user.id) redirect(`/cases/${id}`);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Correct the record"
        title="Edit this case brief"
        description="Fix extraction errors, fill in what you have verified, and remove anything you cannot support. Empty fields stay marked unavailable — they are never filled automatically."
        actions={
          <Link href={`/cases/${id}`} className="btn btn-secondary">
            <Icon name="arrow" size={14} className="rotate-180" /> Back to brief
          </Link>
        }
      />
      <EditBriefForm documentId={id} brief={doc.brief} />
      <DeleteCaseForm documentId={id} title={doc.title} />
    </div>
  );
}
