import * as vscode from "vscode";
import { SupportedLanguage, LANGUAGE_FILENAMES } from "../core/types";
import { SettingsService } from "../core/settings";
import { FakeCodeDocumentProvider } from "../providers/fakeCodeDocumentProvider";

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  "typescript",
  "javascript",
  "python",
  "java",
  "cpp",
  "go",
];

export async function switchLanguage(
  settingsService: SettingsService,
  provider: FakeCodeDocumentProvider
): Promise<void> {
  const items = SUPPORTED_LANGUAGES.map((lang) => ({
    label: lang,
    description: LANGUAGE_FILENAMES[lang],
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: "Select fake code language",
  });

  if (!selected) {
    return;
  }

  await vscode.workspace
    .getConfiguration("commentNovel")
    .update("language", selected.label, vscode.ConfigurationTarget.Global);

  const currentUri = provider.getCurrentUri();
  if (currentUri) {
    const newUri = FakeCodeDocumentProvider.buildUri(selected.label);
    provider.refresh(newUri);
  }

  vscode.window.showInformationMessage(`Switched to ${selected.label}`);
}
