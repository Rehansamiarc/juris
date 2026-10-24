"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  addMessage,
  createConversation,
  deleteConversation,
  getConversation,
  getDocument,
  listMessages,
  logActivity,
} from "@/lib/db";
import { askTutor } from "@/lib/tutor";
import type { ChatMessage, Citation } from "@/lib/types";

export interface TutorResult {
  conversationId?: string;
  message?: ChatMessage;
  mode?: "ai" | "local";
  warning?: string;
  error?: string;
}

export async function sendTutorMessageAction(input: {
  conversationId?: string;
  question: string;
  documentId?: string;
}): Promise<TutorResult> {
  const user = await requireUser();
  const question = input.question.trim();
  if (question.length < 3) return { error: "Ask a slightly fuller question." };
  if (question.length > 2000) return { error: "Keep the question under 2000 characters." };

  let conversationId = input.conversationId;
  if (conversationId) {
    const existing = getConversation(conversationId, user.id);
    if (!existing) return { error: "That conversation no longer exists." };
  } else {
    const created = createConversation(
      user.id,
      question.replace(/\s+/g, " ").slice(0, 80),
      input.documentId,
    );
    conversationId = created.id;
  }

  const conversation = getConversation(conversationId, user.id);
  if (!conversation) return { error: "Could not open the conversation." };

  const documentId = conversation.documentId ?? input.documentId;
  if (documentId) {
    const doc = getDocument(documentId);
    if (!doc || (doc.ownerId && doc.ownerId !== user.id)) {
      return { error: "The document attached to this conversation is unavailable." };
    }
  }

  const history = listMessages(conversation.id)
    .slice(-6)
    .map((message) => ({ role: message.role, content: message.content }));

  const userId = addMessage(conversation.id, "user", question);
  logActivity(user.id, "tutor", `Asked the tutor: ${question.slice(0, 60)}`, conversation.id);

  const answer = await askTutor({
    userId: user.id,
    question,
    documentId: documentId ?? undefined,
    history,
  });

  const citations: Citation[] = answer.citations;
  const assistantId = addMessage(conversation.id, "assistant", answer.content, citations);

  revalidatePath("/tutor");
  revalidatePath("/home");

  return {
    conversationId: conversation.id,
    mode: answer.mode,
    warning: answer.warning,
    message: {
      id: assistantId,
      role: "assistant",
      content: answer.content,
      citations,
      createdAt: new Date().toISOString(),
    },
    ...(userId ? {} : {}),
  };
}

export async function deleteTutorConversationAction(conversationId: string) {
  const user = await requireUser();
  deleteConversation(conversationId, user.id);
  revalidatePath("/tutor");
  return { ok: true };
}
