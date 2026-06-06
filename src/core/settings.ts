import * as vscode from "vscode";
import { CommentNovelSettings, SupportedLanguage } from "./types";

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "typescript",
  "javascript",
  "python",
  "java",
  "cpp",
  "go",
];

export class SettingsService {
  getSettings(): CommentNovelSettings {
    const config = vscode.workspace.getConfiguration("commentNovel");

    const language = this.readLanguage(config);
    const wordsPerComment = this.clampNumber(
      config.get<number>("wordsPerComment", 18),
      1,
      200
    );
    const commentEveryLines = this.clampNumber(
      config.get<number>("commentEveryLines", 5),
      1,
      50
    );
    const pageSize = this.clampNumber(
      config.get<number>("pageSize", 160),
      30,
      1000
    );
    const noiseCommentRatio = this.clampNumber(
      config.get<number>("noiseCommentRatio", 0.15),
      0,
      1
    );

    return {
      language,
      wordsPerComment,
      commentEveryLines,
      pageSize,
      noiseCommentRatio,
    };
  }

  private readLanguage(
    config: vscode.WorkspaceConfiguration
  ): SupportedLanguage {
    const value = config.get<string>("language", "typescript");
    if (SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)) {
      return value as SupportedLanguage;
    }
    return "typescript";
  }

  private clampNumber(value: number, min: number, max: number): number {
    if (isNaN(value)) {
      return min;
    }
    return Math.max(min, Math.min(max, value));
  }
}
