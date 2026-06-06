import * as vscode from "vscode";
import {
  NovelInfo,
  ReadingProgress,
  PageHistoryItem,
  STORAGE_KEYS,
} from "./types";

export class ProgressStore {
  constructor(private readonly globalState: vscode.Memento) {}

  getNovelInfo(): NovelInfo | undefined {
    return this.globalState.get<NovelInfo>(STORAGE_KEYS.novelInfo);
  }

  saveNovelInfo(info: NovelInfo): void {
    this.globalState.update(STORAGE_KEYS.novelInfo, info);
  }

  getProgress(novelPath: string): ReadingProgress {
    const stored = this.globalState.get<ReadingProgress>(
      STORAGE_KEYS.readingProgress
    );
    if (stored && stored.novelPath === novelPath) {
      return stored;
    }
    return this.createDefaultProgress(novelPath);
  }

  saveProgress(progress: ReadingProgress): void {
    this.globalState.update(STORAGE_KEYS.readingProgress, {
      ...progress,
      updatedAt: Date.now(),
    });
  }

  updateOffset(novelPath: string, offset: number): void {
    const progress = this.getProgress(novelPath);
    this.saveProgress({ ...progress, offset });
  }

  pushHistory(
    novelPath: string,
    startOffset: number,
    endOffset: number
  ): void {
    const progress = this.getProgress(novelPath);
    const item: PageHistoryItem = {
      pageIndex: progress.pageIndex,
      startOffset,
      endOffset,
    };
    this.saveProgress({
      ...progress,
      pageIndex: progress.pageIndex + 1,
      offset: endOffset,
      history: [...progress.history, item],
    });
  }

  popHistory(novelPath: string): PageHistoryItem | undefined {
    const progress = this.getProgress(novelPath);
    if (progress.history.length === 0) {
      return undefined;
    }
    const history = [...progress.history];
    const last = history.pop()!;
    this.saveProgress({
      ...progress,
      pageIndex: last.pageIndex,
      offset: last.startOffset,
      history,
    });
    return last;
  }

  resetProgress(novelPath: string): void {
    this.saveProgress(this.createDefaultProgress(novelPath));
  }

  private createDefaultProgress(novelPath: string): ReadingProgress {
    return {
      novelPath,
      offset: 0,
      pageIndex: 0,
      history: [],
      updatedAt: Date.now(),
    };
  }
}
