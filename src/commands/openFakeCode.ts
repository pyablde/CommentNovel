import * as vscode from "vscode";
import { ProgressStore } from "../core/progressStore";
import { SettingsService } from "../core/settings";
import { FakeCodeDocumentProvider } from "../providers/fakeCodeDocumentProvider";

export async function openFakeCode(
  progressStore: ProgressStore,
  settingsService: SettingsService,
  provider: FakeCodeDocumentProvider
): Promise<void> {
  const novelInfo = progressStore.getNovelInfo();
  if (!novelInfo) {
    vscode.window.showWarningMessage(
      "No novel imported. Use CommentNovel: Import Novel first."
    );
    return;
  }

  const settings = settingsService.getSettings();
  const uri = FakeCodeDocumentProvider.buildUri(settings.language);

  const document = await vscode.workspace.openTextDocument(uri);
  await vscode.window.showTextDocument(document, { preview: false });
}
