"use client";

import { useEffect } from "react";

export function ViewLogger({ documentId }: { documentId: string }) {
  useEffect(() => {
    const key = `vidhi-view-${documentId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode */
    }
    const controller = new AbortController();
    fetch("/api/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
      signal: controller.signal,
    }).catch(() => undefined);
    return () => controller.abort();
  }, [documentId]);

  return null;
}
