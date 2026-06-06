import * as vscode from "vscode";
import { ProgressStore } from "../core/progressStore";
import { FakeCodeDocumentProvider } from "../providers/fakeCodeDocumentProvider";

export function nextPage(
  progressStore: ProgressStore,
  provider: FakeCodeDocumentProvider
): void {
  const novelInfo = progressStore.getNovelInfo();
  if (!novelInfo) {
    vscode.window.showWarningMessage("No novel imported.");
    return;
  }

  const output = provider.getLatestOutput();
  if (!output) {
    vscode.window.showWarningMessage("No page generated yet.");
    return;
  }

  progressStore.pushHistory(novelInfo.path, output.startOffset, output.endOffset);
  provider.refresh();
}

export function previousPage(
  progressStore: ProgressStore,
  provider: FakeCodeDocumentProvider
): void {
  const novelInfo = progressStore.getNovelInfo();
  if (!novelInfo) {
    vscode.window.showWarningMessage("No novel imported.");
    return;
  }

  const item = progressStore.popHistory(novelInfo.path);
  if (!item) {
    vscode.window.showInformationMessage("Already at the first page.");
    return;
  }

  provider.refresh();
}

export function resetProgress(
  progressStore: ProgressStore,
  provider: FakeCodeDocumentProvider
): void {
  const novelInfo = progressStore.getNovelInfo();
  if (!novelInfo) {
    vscode.window.showWarningMessage("No novel imported.");
    return;
  }

  progressStore.resetProgress(novelInfo.path);
  provider.refresh();
  vscode.window.showInformationMessage("Reading progress reset.");
}
