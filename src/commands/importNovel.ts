import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ProgressStore } from "../core/progressStore";
import { EncodingDetector } from "../core/encodingDetector";
import { NovelReader } from "../core/novelReader";
import { NovelInfo } from "../core/types";

export async function importNovel(
  progressStore: ProgressStore,
  encodingDetector: EncodingDetector,
  novelReader: NovelReader
): Promise<void> {
  const uris = await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: {
      "Text files": ["txt", "md"],
    },
    title: "Select a novel file",
  });

  if (!uris || uris.length === 0) {
    return;
  }

  const filePath = uris[0].fsPath;

  let buffer: Buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to read file: ${err instanceof Error ? err.message : String(err)}`
    );
    return;
  }

  const detection = encodingDetector.detect(buffer);

  if (detection.confidence === "low") {
    vscode.window.showWarningMessage(
      `Encoding detection confidence is low (${detection.reason}). Using ${detection.encoding}.`
    );
  }

  let decodedText: string;
  try {
    decodedText = novelReader.decode(buffer, detection.encoding);
  } catch (err) {
    vscode.window.showErrorMessage(
      `Failed to decode file with ${detection.encoding}: ${err instanceof Error ? err.message : String(err)}`
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
    `Imported "${novelInfo.name}" (${novelInfo.totalChars} chars, ${detection.encoding})`
  );
}
