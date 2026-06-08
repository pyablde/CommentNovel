import * as vscode from "vscode";
import { ProgressStore } from "../core/progressStore";
import { FakeCodeDocumentProvider } from "../providers/fakeCodeDocumentProvider";

export function nextPage(
  progressStore: ProgressStore,
  provider: FakeCodeDocumentProvider
): void {
  const novelInfo = progressStore.getNovelInfo();
  if (!novelInfo) {
    vscode.window.showWarningMessage("未导入小说。");
    return;
  }

  const output = provider.getLatestOutput();
  if (!output) {
    vscode.window.showWarningMessage("尚未生成页面。");
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
    vscode.window.showWarningMessage("未导入小说。");
    return;
  }

  const item = progressStore.popHistory(novelInfo.path);
  if (!item) {
    vscode.window.showInformationMessage("已是第一页。");
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
    vscode.window.showWarningMessage("未导入小说。");
    return;
  }

  progressStore.resetProgress(novelInfo.path);
  provider.refresh();
  vscode.window.showInformationMessage("阅读进度已重置。");
}
