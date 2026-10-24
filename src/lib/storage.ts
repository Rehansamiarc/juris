import path from "node:path";
import { mkdir } from "node:fs/promises";

export const UPLOAD_ROOT = path.join(process.cwd(), "data", "uploads");

export function scanDir(jobId: string) {
  return path.join(UPLOAD_ROOT, jobId);
}

export async function ensureScanDir(jobId: string) {
  const dir = scanDir(jobId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export function pageFilePath(jobId: string, storedName: string) {
  return path.join(scanDir(jobId), path.basename(storedName));
}

export function extensionFor(mime: string) {
  if (mime === "application/pdf") return ".pdf";
  if (mime === "image/png") return ".png";
  if (mime === "image/webp") return ".webp";
  if (mime === "image/heic" || mime === "image/heif") return ".heic";
  return ".jpg";
}
