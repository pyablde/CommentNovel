import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ProgressStore } from "../core/progressStore";
import { EncodingDetector } from "../core/encodingDetector";
import { NovelReader } from "../core/novelReader";
import { SettingsService } from "../core/settings";
import { NovelInfo } from "../core/types";

export async function importNovel(
  progressStore: ProgressStore,
  encodingDetector: EncodingDetector,
  novelReader: NovelReader,
  settingsService: SettingsService
): Promise<void> {
  const novelDirectory = settingsService.getSettings().novelDirectory;
  let defaultUri: vscode.Uri | undefined;
  try {
    if (
      novelDirectory &&
      fs.existsSync(novelDirectory) &&
      fs.statSync(novelDirectory).isDirectory()
    ) {
      defaultUri = vscode.Uri.file(novelDirectory);
    }
  } catch {
    defaultUri = undefined;
  }

  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    defaultUri,
    filters: {
      "文本文件": ["txt", "md"],
    },
    title: "选择小说文件",
  });

  if (!uris || uris.length === 0) {
    return;
  }

  const filePath = uris[0].fsPath;

  await importNovelFile(progressStore, encodingDetector, novelReader, filePath);
}

export async function importNovelFile(
  progressStore: ProgressStore,
  encodingDetector: EncodingDetector,
  novelReader: NovelReader,
  filePath: string
): Promise<void> {
  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (err) {
    vscode.window.showErrorMessage(
      `读取文件失败：${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  const detection = encodingDetector.detect(buffer);

  if (detection.confidence === "low") {
    vscode.window.showWarningMessage(
      `编码检测置信度较低（${detection.reason}），使用 ${detection.encoding} 编码。`
    );
  }

  let decodedText: string;
  try {
    decodedText = novelReader.decode(buffer, detection.encoding);
  } catch (err) {
    vscode.window.showErrorMessage(
      `使用 ${detection.encoding} 解码文件失败：${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  const novelInfo: NovelInfo = {
    path: filePath,
    name: path.basename(filePath),
    encoding: detection.encoding,
    totalChars: decodedText.length,
    importedAt: Date.now(),
    lastReadAt: Date.now(),
  };

  progressStore.saveNovelInfo(novelInfo);
  progressStore.resetProgress(filePath);

  vscode.window.showInformationMessage(
    `已导入 "${novelInfo.name}"（${novelInfo.totalChars} 字符，${detection.encoding}）`
  );
}
