import * as vscode from "vscode";
import { ProgressStore } from "./core/progressStore";
import { SettingsService } from "./core/settings";
import { EncodingDetector } from "./core/encodingDetector";
import { NovelReader } from "./core/novelReader";
import { FakeCodeGenerator } from "./core/fakeCodeGenerator";
import { FakeCodeDocumentProvider } from "./providers/fakeCodeDocumentProvider";
import { StatusBar } from "./ui/statusBar";
import { SidebarViewProvider } from "./ui/sidebarView";
import { importNovel } from "./commands/importNovel";
import { openFakeCode } from "./commands/openFakeCode";
import { nextPage, previousPage, resetProgress } from "./commands/navigation";
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
  let sidebarView: SidebarViewProvider;

  const importNovelFromUi = async (): Promise<void> => {
    await importNovel(
      progressStore,
      encodingDetector,
      novelReader,
      settingsService
    );
    provider.refresh();
    statusBar.update();
    sidebarView?.refresh();
  };

  const openFakeCodeFromUi = async (): Promise<void> => {
    await openFakeCode(progressStore, settingsService, provider);
    statusBar.update();
    sidebarView?.refresh();
  };

  const nextPageFromUi = (): void => {
    nextPage(progressStore, provider);
    statusBar.update();
  };

  const previousPageFromUi = (): void => {
    previousPage(progressStore, provider);
    statusBar.update();
  };

  const resetProgressFromUi = (): void => {
    resetProgress(progressStore, provider);
    statusBar.update();
  };

  const settingsWebview = new SettingsWebview(
    settingsService,
    context.extensionUri,
    progressStore,
    importNovelFromUi,
    openFakeCodeFromUi
  );

  sidebarView = new SidebarViewProvider({
    openSettings: () => settingsWebview.open(),
  });

  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider("fake-code", provider)
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarViewProvider.viewType,
      sidebarView,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("commentNovel.novelDirectory")) {
        sidebarView.refresh();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.nextPage", () => {
      nextPageFromUi();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.previousPage", () => {
      previousPageFromUi();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.openSettings", () => {
      settingsWebview.open();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.importNovel", async () => {
      await importNovelFromUi();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.openFakeCode", async () => {
      await openFakeCodeFromUi();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("CommentNovel.resetProgress", () => {
      resetProgressFromUi();
    })
  );

  context.subscriptions.push(statusBar);
  context.subscriptions.push(provider);
  context.subscriptions.push({ dispose: () => settingsWebview.dispose() });

  console.log("CommentNovel extension activated");
}

export function deactivate(): void {
  // nothing to clean up
}
