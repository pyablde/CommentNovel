import * as vscode from "vscode";
import { CommentNovelSettings, SupportedLanguage } from "../core/types";
import { SettingsService } from "../core/settings";

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
    private readonly extensionUri: vscode.Uri
  ) {}

  open(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "commentNovel.settings",
      "CommentNovel Settings",
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
  }): Promise<void> {
    switch (message.type) {
      case "ready": {
        const settings = this.settingsService.getSettings();
        this.panel?.webview.postMessage({
          type: "settings",
          settings,
        });
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
    }
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
  <title>CommentNovel Settings</title>
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

    .subtitle {
      color: var(--desc-fg);
      margin-bottom: 28px;
      font-size: 0.9em;
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
  <h1>📖 CommentNovel</h1>
  <p class="subtitle">Configure your reading experience</p>

  <div class="section">
    <div class="section-title">Language</div>
    <div class="field">
      <div class="field-header">
        <label for="language">Fake Code Language</label>
      </div>
      <p class="description">The programming language used to disguise the novel content as code.</p>
      <select id="language">
        ${languageOptions}
      </select>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Content Layout</div>

    <div class="field">
      <div class="field-header">
        <label for="wordsPerComment">Words Per Comment</label>
        <span class="value-display" id="wordsPerComment-val">18</span>
      </div>
      <p class="description">Number of novel characters embedded in each code comment line.</p>
      <input type="range" id="wordsPerComment" min="1" max="200" step="1" value="18">
    </div>

    <div class="field">
      <div class="field-header">
        <label for="commentEveryLines">Comment Interval</label>
        <span class="value-display" id="commentEveryLines-val">5</span>
      </div>
      <p class="description">Insert a novel comment every N lines of generated code.</p>
      <input type="range" id="commentEveryLines" min="1" max="50" step="1" value="5">
    </div>

    <div class="field">
      <div class="field-header">
        <label for="pageSize">Page Size (lines)</label>
        <span class="value-display" id="pageSize-val">160</span>
      </div>
      <p class="description">Number of code lines per page.</p>
      <input type="range" id="pageSize" min="30" max="1000" step="10" value="160">
    </div>

    <div class="field">
      <div class="field-header">
        <label for="noiseCommentRatio">Noise Comment Ratio</label>
        <span class="value-display" id="noiseCommentRatio-val">15%</span>
      </div>
      <p class="description">Ratio of fake technical comments mixed in to make the code look more realistic.</p>
      <div class="range-row">
        <input type="range" id="noiseCommentRatio" min="0" max="100" step="1" value="15">
      </div>
    </div>
  </div>

  <div class="reset-section">
    <button id="resetBtn">Reset to Defaults</button>
  </div>

  <div class="footer">
    CommentNovel v0.1.0 &mdash; Read novels in your code editor
  </div>

  <div class="toast" id="toast"></div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    const DEFAULTS = {
      language: "typescript",
      wordsPerComment: 18,
      commentEveryLines: 5,
      pageSize: 160,
      noiseCommentRatio: 15,
    };

    const els = {
      language: document.getElementById("language"),
      wordsPerComment: document.getElementById("wordsPerComment"),
      wordsPerCommentVal: document.getElementById("wordsPerComment-val"),
      commentEveryLines: document.getElementById("commentEveryLines"),
      commentEveryLinesVal: document.getElementById("commentEveryLines-val"),
      pageSize: document.getElementById("pageSize"),
      pageSizeVal: document.getElementById("pageSize-val"),
      noiseCommentRatio: document.getElementById("noiseCommentRatio"),
      noiseCommentRatioVal: document.getElementById("noiseCommentRatio-val"),
      resetBtn: document.getElementById("resetBtn"),
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
      els.commentEveryLinesVal.textContent = els.commentEveryLines.value;
      els.pageSizeVal.textContent = els.pageSize.value;
      els.noiseCommentRatioVal.textContent = els.noiseCommentRatio.value + "%";
    }

    function applySettings(settings) {
      els.language.value = settings.language;
      els.wordsPerComment.value = settings.wordsPerComment;
      els.commentEveryLines.value = settings.commentEveryLines;
      els.pageSize.value = settings.pageSize;
      els.noiseCommentRatio.value = Math.round(settings.noiseCommentRatio * 100);
      updateDisplayValues();
    }

    function sendUpdate(key, value) {
      vscode.postMessage({ type: "update", key, value });
    }

    els.language.addEventListener("change", () => {
      sendUpdate("commentNovel.language", els.language.value);
    });

    els.wordsPerComment.addEventListener("input", () => {
      updateDisplayValues();
    });
    els.wordsPerComment.addEventListener("change", () => {
      sendUpdate("commentNovel.wordsPerComment", parseInt(els.wordsPerComment.value, 10));
    });

    els.commentEveryLines.addEventListener("input", () => {
      updateDisplayValues();
    });
    els.commentEveryLines.addEventListener("change", () => {
      sendUpdate("commentNovel.commentEveryLines", parseInt(els.commentEveryLines.value, 10));
    });

    els.pageSize.addEventListener("input", () => {
      updateDisplayValues();
    });
    els.pageSize.addEventListener("change", () => {
      sendUpdate("commentNovel.pageSize", parseInt(els.pageSize.value, 10));
    });

    els.noiseCommentRatio.addEventListener("input", () => {
      updateDisplayValues();
    });
    els.noiseCommentRatio.addEventListener("change", () => {
      sendUpdate("commentNovel.noiseCommentRatio", parseInt(els.noiseCommentRatio.value, 10) / 100);
    });

    els.resetBtn.addEventListener("click", () => {
      applySettings(DEFAULTS);
      sendUpdate("commentNovel.language", DEFAULTS.language);
      sendUpdate("commentNovel.wordsPerComment", DEFAULTS.wordsPerComment);
      sendUpdate("commentNovel.commentEveryLines", DEFAULTS.commentEveryLines);
      sendUpdate("commentNovel.pageSize", DEFAULTS.pageSize);
      sendUpdate("commentNovel.noiseCommentRatio", DEFAULTS.noiseCommentRatio / 100);
      showToast("Settings reset to defaults");
    });

    window.addEventListener("message", (event) => {
      const msg = event.data;
      if (msg.type === "settings") {
        applySettings(msg.settings);
      } else if (msg.type === "saved") {
        showToast("Saved");
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
