import * as vscode from "vscode";
import { ProgressStore } from "./core/progressStore";
import { SettingsService } from "./core/settings";
import { EncodingDetector } from "./core/encodingDetector";
import { NovelReader } from "./core/novelReader";
import { FakeCodeGenerator } from "./core/fakeCodeGenerator";
import { FakeCodeDocumentProvider } from "./providers/fakeCodeDocumentProvider";
import { StatusBar } from "./ui/statusBar";
import { importNovel } from "./commands/importNovel";
import { openFakeCode } from "./commands/openFakeCode";
import { nextPage, previousPage, resetProgress } from "./commands/navigation";
import { switchLanguage } from "./commands/switchLanguage";
import { SettingsWebview } from "./ui/settingsWebview";

export function activate(context: vscode.ExtensionContext): void {
  const progressStore = new ProgressStore(context.globalState);
  const settingsService = new SettingsService();
  const encodingDetector = new EncodingDetector();
  const novelReader = new NovelReader();
  const fakeCodeGenerator = new FakeCodeGenerator();

  const provider = new FakeCodeDocumentProvider(
    progressStore,
    settingsService,
    novelReader,
    fakeCodeGenerator
  );

  const statusBar = new StatusBar(progressStore);
  const settingsWebview = new SettingsWebview(settingsService, context.extensionUri);

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("fake-code", provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.importNovel", () =>
      importNovel(progressStore, encodingDetector, novelReader).then(() =>
        statusBar.update()
      )
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.openFakeCode", () =>
      openFakeCode(progressStore, settingsService, provider)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.nextPage", () => {
      nextPage(progressStore, provider);
      statusBar.update();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.previousPage", () => {
      previousPage(progressStore, provider);
      statusBar.update();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.resetProgress", () => {
      resetProgress(progressStore, provider);
      statusBar.update();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.switchLanguage", () =>
      switchLanguage(settingsService, provider)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.openSettings", () =>
      settingsWebview.open()
    )
  );

  context.subscriptions.push(statusBar);
  context.subscriptions.push(provider);
  context.subscriptions.push({ dispose: () => settingsWebview.dispose() });

  console.log("CommentNovel extension activated");
}

export function deactivate(): void {
  // nothing to clean up
}
