export type Course = "LLB" | "BA LLB" | "BBA LLB" | "Judiciary preparation" | "Other";

export type DocumentKind = "statute" | "judgment" | "article" | "note" | "upload" | "brief";

export type Verification = "official-source" | "limited-verification" | "unverified" | "ai-generated";

export interface CaseBrief {
  caseName: string;
  citation: string;
  court: string;
  date: string;
  bench: string;
  facts: string;
  proceduralHistory: string;
  issues: string[];
  petitionerArguments: string;
  respondentArguments: string;
  statutes: string[];
  precedents: string[];
  reasoning: string;
  decision: string;
  ratio: string[];
  obiter: string[];
  principles: string[];
  examSummary: string;
  pointsToRemember: string[];
  thirtySecond: string;
  oneMinute: string;
  beginner: string;
  examOutline: string[];
  missing: string[];
  confidence: "high" | "medium" | "low";
  generatedBy: "ai" | "local" | "curated";
}

export interface DocumentMeta {
  tags?: string[];
  bench?: string;
  sections?: string[];
  quiz?: QuizQuestion[];
  verificationNote?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface DocumentRecord {
  id: string;
  ownerId: string | null;
  kind: DocumentKind;
  title: string;
  subtitle: string | null;
  citation: string | null;
  court: string | null;
  year: number | null;
  subject: string | null;
  jurisdiction: string | null;
  docType: string | null;
  sourceUrl: string | null;
  officialText: string | null;
  explanation: string | null;
  brief: CaseBrief | null;
  meta: DocumentMeta;
  verification: Verification;
  createdAt: string;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface ProfileRecord {
  userId: string;
  course: Course;
  yearLabel: string;
  subjects: string[];
  goal: string;
  dailyMinutes: number;
  onboardedAt: string | null;
}

export interface ScanPage {
  id: string;
  name: string;
  kind: "image" | "pdf";
  mime: string;
  path: string;
  size: number;
  rotation: number;
  crop: { top: number; right: number; bottom: number; left: number };
}

export interface ScanJobRecord {
  id: string;
  userId: string;
  title: string;
  status: "draft" | "ready" | "failed" | "saved";
  pages: ScanPage[];
  rawText: string;
  error: string | null;
  documentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FlashcardRecord {
  id: string;
  userId: string;
  documentId: string | null;
  front: string;
  back: string;
  source: string | null;
  ease: number;
  intervalDays: number;
  dueAt: string;
  reps: number;
  lapses: number;
  createdAt: string;
}

export interface QuizRecord {
  id: string;
  userId: string;
  documentId: string | null;
  title: string;
  subject: string | null;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  createdAt: string;
}

export interface Citation {
  documentId: string;
  title: string;
  snippet: string;
  sourceUrl: string | null;
  verification: Verification;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  documentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeadlineRecord {
  id: string;
  userId: string;
  title: string;
  subject: string | null;
  dueAt: string;
  notes: string | null;
  completed: boolean;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  kind: string;
  label: string;
  refId: string | null;
  createdAt: string;
}
