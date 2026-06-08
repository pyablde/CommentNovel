import * as vscode from "vscode";
import { ProgressStore } from "../core/progressStore";

export class StatusBar {
  private readonly item: vscode.StatusBarItem;

  constructor(private readonly progressStore: ProgressStore) {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.item.command = "CommentNovel.openSettings";
    this.item.tooltip = "点击打开 CommentNovel 设置";
    this.update();
  }

  update(): void {
    const novelInfo = this.progressStore.getNovelInfo();
    if (!novelInfo) {
      this.item.text = "$(book) CommentNovel";
      this.item.show();
      return;
    }

    const progress = this.progressStore.getProgress(novelInfo.path);
    const percent =
      novelInfo.totalChars > 0
        ? Math.min(
            100,
            Math.round((progress.offset / novelInfo.totalChars) * 100)
          )
        : 0;

    this.item.text = `$(book) CommentNovel ${percent}%`;
    this.item.show();
  }

  dispose(): void {
    this.item.dispose();
  }
}
