import * as vscode from "vscode";
import { ProgressStore } from "../core/progressStore";
import { SettingsService } from "../core/settings";
import { NovelReader } from "../core/novelReader";
import { FakeCodeGenerator } from "../core/fakeCodeGenerator";
import { GenerateOutput, LANGUAGE_FILENAMES } from "../core/types";

export class FakeCodeDocumentProvider
  implements vscode.TextDocumentContentProvider
{
  private readonly _onDidChange = new vscode.EventEmitter<vscode.Uri>();
  readonly onDidChange = this._onDidChange.event;

  private latestOutput: GenerateOutput | undefined;
  private currentUri: vscode.Uri | undefined;

  constructor(
    private readonly progressStore: ProgressStore,
    private readonly settingsService: SettingsService,
    private readonly novelReader: NovelReader,
    private readonly fakeCodeGenerator: FakeCodeGenerator
  ) {}

  provideTextDocumentContent(uri: vscode.Uri): string {
    const novelInfo = this.progressStore.getNovelInfo();
    if (!novelInfo) {
      return "// No novel imported. Use CommentNovel: Import Novel to get started.";
    }

    const progress = this.progressStore.getProgress(novelInfo.path);
    const settings = this.settingsService.getSettings();

    let novelText: string;
    try {
      novelText = this.novelReader.readAndDecode(
        novelInfo.path,
        novelInfo.encoding
      );
    } catch (err) {
      console.error("Failed to read novel file:", err);
      return `// Error: Could not read novel file at ${novelInfo.path}`;
    }

    const output = this.fakeCodeGenerator.generate({
      language: settings.language,
      pageSize: settings.pageSize,
      commentEveryLines: settings.commentEveryLines,
      novelCommentLines: settings.novelCommentLines,
      wordsPerComment: settings.wordsPerComment,
      noiseCommentRatio: settings.noiseCommentRatio,
      novelText,
      novelOffset: progress.offset,
      pageIndex: progress.pageIndex,
    });

    this.latestOutput = output;
    this.currentUri = uri;

    return output.code;
  }

  refresh(uri?: vscode.Uri): void {
    const target = uri ?? this.currentUri;
    if (target) {
      this._onDidChange.fire(target);
    }
  }

  getLatestOutput(): GenerateOutput | undefined {
    return this.latestOutput;
  }

  getCurrentUri(): vscode.Uri | undefined {
    return this.currentUri;
  }

  static buildUri(language: string): vscode.Uri {
    const filename =
      LANGUAGE_FILENAMES[language as keyof typeof LANGUAGE_FILENAMES] ??
      "auth-service.ts";
    return vscode.Uri.parse(`fake-code://novel/${filename}`);
  }

  dispose(): void {
    this._onDidChange.dispose();
  }
}
