export type SupportedEncoding = "utf8" | "gbk" | "gb2312";

export type SupportedLanguage =
  | "typescript"
  | "javascript"
  | "python"
  | "java"
  | "cpp"
  | "go";

export interface NovelInfo {
  path: string;
  name: string;
  encoding: SupportedEncoding;
  totalChars: number;
  importedAt: number;
  lastReadAt: number;
}

export interface ReadingProgress {
  novelPath: string;
  offset: number;
  pageIndex: number;
  history: PageHistoryItem[];
  updatedAt: number;
}

export interface PageHistoryItem {
  pageIndex: number;
  startOffset: number;
  endOffset: number;
}

export interface CommentNovelSettings {
  language: SupportedLanguage;
  wordsPerComment: number;
  commentEveryLines: number;
  pageSize: number;
  noiseCommentRatio: number;
}

export interface EncodingDetectionResult {
  encoding: SupportedEncoding;
  confidence: "high" | "medium" | "low";
  reason: string;
}

export interface GenerateInput {
  language: SupportedLanguage;
  pageSize: number;
  commentEveryLines: number;
  wordsPerComment: number;
  noiseCommentRatio: number;
  novelText: string;
  novelOffset: number;
  pageIndex: number;
}

export interface GenerateOutput {
  code: string;
  startOffset: number;
  endOffset: number;
  insertedNovelComments: number;
}

export interface GenerateLineContext {
  lineNumber: number;
  isNovelCommentLine: boolean;
  novelChunk?: string;
  isNoiseCommentLine: boolean;
  noiseComment?: string;
}

export const STORAGE_KEYS = {
  novelInfo: "commentNovel.novelInfo",
  readingProgress: "commentNovel.readingProgress",
} as const;

export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string> = {
  typescript: ".ts",
  javascript: ".js",
  python: ".py",
  java: ".java",
  cpp: ".cpp",
  go: ".go",
};

export const LANGUAGE_FILENAMES: Record<SupportedLanguage, string> = {
  typescript: "auth-service.ts",
  javascript: "cache-client.js",
  python: "data_pipeline.py",
  java: "RequestHandler.java",
  cpp: "cache_manager.cpp",
  go: "service_registry.go",
};
