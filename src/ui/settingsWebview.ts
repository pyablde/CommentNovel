import * as vscode from "vscode";
import { SupportedLanguage } from "../core/types";
import { SettingsService } from "../core/settings";
import { ProgressStore } from "../core/progressStore";

const SUPPORTED_LANGUAGES: { value: SupportedLanguage; label: string }[] = [
  { value: "typescript", label: "TypeScript" },
  { value: "javascript", label: "JavaScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "go", label: "Go" },
];

export class SettingsWebview {
  private panel: vscode.WebviewPanel | undefined;

  constructor(
    private readonly settingsService: SettingsService,
    private readonly extensionUri: vscode.Uri,
    private readonly progressStore: ProgressStore,
    private readonly importNovel: () => Promise<void>,
    private readonly openFakeCode: () => Promise<void>
  ) {}

  open(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "commentNovel.settings",
      "CommentNovel 设置",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.extensionUri],
      }
    );

    this.panel.webview.html = this.buildHtml(this.panel.webview);

    this.panel.webview.onDidReceiveMessage(
      (message) => this.handleMessage(message),
      undefined,
      []
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private async handleMessage(message: {
    type: string;
    key?: string;
    value?: unknown;
    command?: string;
  }): Promise<void> {
    switch (message.type) {
      case "ready": {
        const settings = this.settingsService.getSettings();
        this.panel?.webview.postMessage({
          type: "settings",
          settings,
          novelInfo: this.progressStore.getNovelInfo(),
        });
        break;
      }
      case "selectNovel": {
        await this.importNovel();
        this.panel?.webview.postMessage({
          type: "novelInfo",
          novelInfo: this.progressStore.getNovelInfo(),
        });
        break;
      }
      case "selectNovelDirectory": {
        await this.selectNovelDirectory();
        break;
      }
      case "openFakeCode": {
        await this.openFakeCode();
        break;
      }
      case "update": {
        if (message.key && message.value !== undefined) {
          await vscode.workspace
            .getConfiguration("commentNovel")
            .update(
              message.key,
              message.value,
              vscode.ConfigurationTarget.Global
            );
          this.panel?.webview.postMessage({ type: "saved", key: message.key });
        }
        break;
      }
      case "openKeyboardShortcuts": {
        if (message.command) {
          await vscode.commands.executeCommand(
            "workbench.action.openGlobalKeybindings",
            `@command:${message.command}`
          );
        }
        break;
      }
    }
  }

  private async selectNovelDirectory(): Promise<void> {
    const settings = this.settingsService.getSettings();
    const uris = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      defaultUri: settings.novelDirectory
        ? vscode.Uri.file(settings.novelDirectory)
        : undefined,
      title: "选择小说目录",
    });

    if (!uris || uris.length === 0) {
      return;
    }

    await vscode.workspace
      .getConfiguration("commentNovel")
      .update(
        "novelDirectory",
        uris[0].fsPath,
        vscode.ConfigurationTarget.Global
      );

    this.panel?.webview.postMessage({
      type: "settings",
      settings: this.settingsService.getSettings(),
      novelInfo: this.progressStore.getNovelInfo(),
    });
    this.panel?.webview.postMessage({
      type: "saved",
      key: "novelDirectory",
    });
  }

  private buildHtml(webview: vscode.Webview): string {
    const nonce = this.getNonce();

    const languageOptions = SUPPORTED_LANGUAGES.map(
      (lang) =>
        `<option value="${lang.value}" data-label="${lang.label}">${lang.label}</option>`
    ).join("\n            ");

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"
  >
  <title>CommentNovel 设置</title>
  <style>
    :root {
      --bg: var(--vscode-editor-background);
      --fg: var(--vscode-editor-foreground);
      --input-bg: var(--vscode-input-background);
      --input-fg: var(--vscode-input-foreground);
      --input-border: var(--vscode-input-border);
      --btn-bg: var(--vscode-button-background);
      --btn-fg: var(--vscode-button-foreground);
      --btn-hover: var(--vscode-button-hoverBackground);
      --card-bg: var(--vscode-editorWidget-background);
      --card-border: var(--vscode-editorWidget-border);
      --desc-fg: var(--vscode-descriptionForeground);
      --focus-border: var(--vscode-focusBorder);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--fg);
      background: var(--bg);
      padding: 24px;
      max-width: 640px;
      margin: 0 auto;
    }

    h1 {
      font-size: 1.6em;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .section {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--card-border);
    }

    .field {
      margin-bottom: 18px;
    }

    .field:last-child {
      margin-bottom: 0;
    }

    .field-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
    }

    label {
      font-weight: 500;
    }

    .value-display {
      font-size: 0.85em;
      color: var(--desc-fg);
      font-variant-numeric: tabular-nums;
    }

    .description {
      color: var(--desc-fg);
      font-size: 0.82em;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .path-box {
      width: 100%;
      min-height: 34px;
      padding: 7px 10px;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      font-family: var(--vscode-editor-font-family);
      font-size: 0.86em;
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .path-box.empty {
      color: var(--desc-fg);
      font-family: inherit;
    }

    .button-row {
      display: flex;
      justify-content: flex-start;
      gap: 10px;
      margin-top: 10px;
    }

    select, input[type="number"] {
      width: 100%;
      padding: 6px 10px;
      background: var(--input-bg);
      color: var(--input-fg);
      border: 1px solid var(--input-border);
      border-radius: 4px;
      font-family: inherit;
      font-size: inherit;
      outline: none;
      transition: border-color 0.15s;
    }

    select:focus, input:focus {
      border-color: var(--focus-border);
    }

    input[type="range"] {
      width: 100%;
      accent-color: var(--btn-bg);
      cursor: pointer;
    }

    .range-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .range-row input[type="range"] {
      flex: 1;
    }

    .range-value {
      min-width: 48px;
      text-align: right;
      font-variant-numeric: tabular-nums;
      color: var(--fg);
    }

    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: var(--btn-bg);
      color: var(--btn-fg);
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 0.85em;
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.25s, transform 0.25s;
      pointer-events: none;
    }

    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }

    .reset-section {
      text-align: center;
      margin-top: 24px;
    }

    .shortcut-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--card-border);
    }

    .shortcut-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .shortcut-title {
      font-weight: 500;
      margin-bottom: 4px;
    }

    .shortcut-command {
      color: var(--desc-fg);
      font-size: 0.82em;
      font-family: var(--vscode-editor-font-family);
    }

    button {
      padding: 8px 20px;
      background: var(--btn-bg);
      color: var(--btn-fg);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-family: inherit;
      font-size: inherit;
      transition: background 0.15s;
    }

    button:hover {
      background: var(--btn-hover);
    }

    .footer {
      text-align: center;
      color: var(--desc-fg);
      font-size: 0.8em;
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--card-border);
    }
  </style>
</head>
<body>
  <h1>CommentNovel</h1>

  <div class="section">
    <div class="section-title">小说文件</div>
    <div class="field">
      <div class="field-header">
        <label for="novelDirectoryPath">读取小说目录</label>
      </div>
      <p class="description">导入小说时默认打开的目录。</p>
      <div class="path-box empty" id="novelDirectoryPath">未设置小说目录</div>
      <div class="button-row">
        <button id="selectNovelDirectoryBtn">选择目录</button>
      </div>
    </div>
    <div class="field">
      <div class="field-header">
        <label for="novelPath">导入路径</label>
        <span class="value-display" id="novelMeta"></span>
      </div>
      <p class="description">当前用于生成伪装代码的小说文件路径。</p>
      <div class="path-box empty" id="novelPath">尚未导入小说</div>
      <div class="button-row">
        <button id="selectNovelBtn">选择小说文件</button>
        <button id="openFakeCodeBtn">打开伪装代码</button>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">语言</div>
    <div class="field">
      <div class="field-header">
        <label for="language">伪装代码语言</label>
      </div>
      <p class="description">用于将小说内容伪装成代码的编程语言。</p>
      <select id="language">
        ${languageOptions}
      </select>
    </div>
  </div>

  <div class="section">
    <div class="section-title">内容布局</div>

    <div class="field">
      <div class="field-header">
        <label for="wordsPerComment">每行注释字数</label>
        <span class="value-display" id="wordsPerComment-val">12</span>
      </div>
      <p class="description">每行代码注释中嵌入的小说字符数。</p>
      <input type="range" id="wordsPerComment" min="1" max="200" step="1" value="12">
    </div>

    <div class="field">
      <div class="field-header">
        <label for="novelCommentLines">小说注释行数</label>
        <span class="value-display" id="novelCommentLines-val">1000</span>
      </div>
      <p class="description">每页最多显示的小说注释行数。仍受注释间隔和页面大小限制。</p>
      <input type="range" id="novelCommentLines" min="1" max="1000" step="1" value="1000">
    </div>

    <div class="field">
      <div class="field-header">
        <label for="commentEveryLines">注释间隔</label>
        <span class="value-display" id="commentEveryLines-val">12</span>
      </div>
      <p class="description">每 N 行生成的代码插入一条小说注释。</p>
      <input type="range" id="commentEveryLines" min="1" max="50" step="1" value="12">
    </div>

    <div class="field">
      <div class="field-header">
        <label for="pageSize">页面大小（行数）</label>
        <span class="value-display" id="pageSize-val">160</span>
      </div>
      <p class="description">每页的代码行数。</p>
      <input type="range" id="pageSize" min="30" max="1000" step="10" value="160">
    </div>

    <div class="field">
      <div class="field-header">
        <label for="noiseCommentRatio">噪音注释比例</label>
        <span class="value-display" id="noiseCommentRatio-val">15%</span>
      </div>
      <p class="description">混入的虚假技术注释比例，使代码看起来更真实。</p>
      <div class="range-row">
        <input type="range" id="noiseCommentRatio" min="0" max="100" step="1" value="15">
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">翻页快捷键</div>
    <div class="shortcut-row">
      <div>
        <div class="shortcut-title">上一页</div>
        <div class="shortcut-command">CommentNovel.previousPage</div>
      </div>
      <button class="shortcut-btn" data-command="CommentNovel.previousPage">配置</button>
    </div>
    <div class="shortcut-row">
      <div>
        <div class="shortcut-title">下一页</div>
        <div class="shortcut-command">CommentNovel.nextPage</div>
      </div>
      <button class="shortcut-btn" data-command="CommentNovel.nextPage">配置</button>
    </div>
  </div>

  <div class="reset-section">
    <button id="resetBtn">恢复默认设置</button>
  </div>

  <div class="footer">
    CommentNovel v0.1.7 &mdash; 在代码编辑器中阅读小说
  </div>

  <div class="toast" id="toast"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    const DEFAULTS = {
      novelDirectory: "",
      language: "typescript",
      wordsPerComment: 12,
      novelCommentLines: 1000,
      commentEveryLines: 12,
      pageSize: 160,
      noiseCommentRatio: 15,
    };

    const els = {
      language: document.getElementById("language"),
      novelDirectoryPath: document.getElementById("novelDirectoryPath"),
      selectNovelDirectoryBtn: document.getElementById("selectNovelDirectoryBtn"),
      novelPath: document.getElementById("novelPath"),
      novelMeta: document.getElementById("novelMeta"),
      selectNovelBtn: document.getElementById("selectNovelBtn"),
      openFakeCodeBtn: document.getElementById("openFakeCodeBtn"),
      wordsPerComment: document.getElementById("wordsPerComment"),
      wordsPerCommentVal: document.getElementById("wordsPerComment-val"),
      novelCommentLines: document.getElementById("novelCommentLines"),
      novelCommentLinesVal: document.getElementById("novelCommentLines-val"),
      commentEveryLines: document.getElementById("commentEveryLines"),
      commentEveryLinesVal: document.getElementById("commentEveryLines-val"),
      pageSize: document.getElementById("pageSize"),
      pageSizeVal: document.getElementById("pageSize-val"),
      noiseCommentRatio: document.getElementById("noiseCommentRatio"),
      noiseCommentRatioVal: document.getElementById("noiseCommentRatio-val"),
      resetBtn: document.getElementById("resetBtn"),
      shortcutBtns: document.querySelectorAll(".shortcut-btn"),
      toast: document.getElementById("toast"),
    };

    let toastTimer;

    function showToast(text) {
      els.toast.textContent = text;
      els.toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1500);
    }

    function updateDisplayValues() {
      els.wordsPerCommentVal.textContent = els.wordsPerComment.value;
      els.novelCommentLinesVal.textContent = els.novelCommentLines.value;
      els.commentEveryLinesVal.textContent = els.commentEveryLines.value;
      els.pageSizeVal.textContent = els.pageSize.value;
      els.noiseCommentRatioVal.textContent = els.noiseCommentRatio.value + "%";
    }

    function applySettings(settings) {
      if (settings.novelDirectory) {
        els.novelDirectoryPath.textContent = settings.novelDirectory;
        els.novelDirectoryPath.classList.remove("empty");
      } else {
        els.novelDirectoryPath.textContent = "未设置小说目录";
        els.novelDirectoryPath.classList.add("empty");
      }

      els.language.value = settings.language;
      els.wordsPerComment.value = settings.wordsPerComment;
      els.novelCommentLines.value = settings.novelCommentLines;
      els.commentEveryLines.value = settings.commentEveryLines;
      els.pageSize.value = settings.pageSize;
      els.noiseCommentRatio.value = Math.round(settings.noiseCommentRatio * 100);
      updateDisplayValues();
    }

    function applyNovelInfo(novelInfo) {
      if (!novelInfo) {
        els.novelPath.textContent = "尚未导入小说";
        els.novelPath.classList.add("empty");
        els.novelMeta.textContent = "";
        return;
      }

      els.novelPath.textContent = novelInfo.path;
      els.novelPath.classList.remove("empty");
      els.novelMeta.textContent = novelInfo.totalChars + " 字符";
    }

    function sendUpdate(key, value) {
      vscode.postMessage({ type: "update", key, value });
    }

    els.language.addEventListener("change", () => {
      sendUpdate("language", els.language.value);
    });

    els.wordsPerComment.addEventListener("input", () => {
      updateDisplayValues();
    });
    els.wordsPerComment.addEventListener("change", () => {
      sendUpdate("wordsPerComment", parseInt(els.wordsPerComment.value, 10));
    });

    els.novelCommentLines.addEventListener("input", () => {
      updateDisplayValues();
    });
    els.novelCommentLines.addEventListener("change", () => {
      sendUpdate("novelCommentLines", parseInt(els.novelCommentLines.value, 10));
    });

    els.commentEveryLines.addEventListener("input", () => {
      updateDisplayValues();
    });
    els.commentEveryLines.addEventListener("change", () => {
      sendUpdate("commentEveryLines", parseInt(els.commentEveryLines.value, 10));
    });

    els.pageSize.addEventListener("input", () => {
      updateDisplayValues();
    });
    els.pageSize.addEventListener("change", () => {
      sendUpdate("pageSize", parseInt(els.pageSize.value, 10));
    });

    els.noiseCommentRatio.addEventListener("input", () => {
      updateDisplayValues();
    });
    els.noiseCommentRatio.addEventListener("change", () => {
      sendUpdate("noiseCommentRatio", parseInt(els.noiseCommentRatio.value, 10) / 100);
    });

    els.resetBtn.addEventListener("click", () => {
      applySettings(DEFAULTS);
      sendUpdate("novelDirectory", DEFAULTS.novelDirectory);
      sendUpdate("language", DEFAULTS.language);
      sendUpdate("wordsPerComment", DEFAULTS.wordsPerComment);
      sendUpdate("novelCommentLines", DEFAULTS.novelCommentLines);
      sendUpdate("commentEveryLines", DEFAULTS.commentEveryLines);
      sendUpdate("pageSize", DEFAULTS.pageSize);
      sendUpdate("noiseCommentRatio", DEFAULTS.noiseCommentRatio / 100);
      showToast("设置已恢复默认值");
    });

    els.selectNovelBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "selectNovel" });
    });

    els.selectNovelDirectoryBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "selectNovelDirectory" });
    });

    els.openFakeCodeBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "openFakeCode" });
    });

    els.shortcutBtns.forEach((button) => {
      button.addEventListener("click", () => {
        vscode.postMessage({
          type: "openKeyboardShortcuts",
          command: button.dataset.command,
        });
      });
    });

    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (msg.type === "settings") {
        applySettings(msg.settings);
        applyNovelInfo(msg.novelInfo);
      } else if (msg.type === "novelInfo") {
        applyNovelInfo(msg.novelInfo);
        showToast("小说路径已更新");
      } else if (msg.type === "saved") {
        showToast("已保存");
      }
    });

    vscode.postMessage({ type: "ready" });
  </script>
</body>
</html>`;
  }

  private getNonce(): string {
    let text = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }

  dispose(): void {
    this.panel?.dispose();
  }
}
