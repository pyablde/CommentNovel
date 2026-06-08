import * as vscode from "vscode";

export interface SidebarViewActions {
  openSettings: () => void;
}

export class SidebarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "commentNovel.sidebar";

  constructor(private readonly actions: SidebarViewActions) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    try {
      webviewView.webview.options = {
        enableScripts: true,
      };

      webviewView.webview.onDidReceiveMessage((message) => {
        switch (message.type) {
          case "openSettings":
            this.actions.openSettings();
            break;
        }
      });

      webviewView.webview.html = this.buildHtml();
    } catch (err) {
      console.error("Failed to resolve CommentNovel sidebar:", err);
      webviewView.webview.html = this.buildErrorHtml(err);
    }
  }

  refresh(): void {
    // Kept for callers that refresh side UI after settings or novel changes.
  }

  private buildHtml(): string {
    const nonce = this.getNonce();

    return /* html */ `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';"
  >
  <title>CommentNovel</title>
  <style>
    :root {
      --bg: var(--vscode-sideBar-background);
      --fg: var(--vscode-sideBar-foreground);
      --button-bg: var(--vscode-button-background);
      --button-fg: var(--vscode-button-foreground);
      --button-hover: var(--vscode-button-hoverBackground);
      --focus: var(--vscode-focusBorder);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      padding: 0;
      color: var(--fg);
      background: var(--bg);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      line-height: 1.4;
    }

    .shell {
      min-height: 100vh;
      padding: 10px;
    }

    .settings-button {
      width: 100%;
      min-height: 30px;
      border: none;
      border-radius: 4px;
      color: var(--button-fg);
      background: var(--button-bg);
      cursor: pointer;
      font: inherit;
      font-weight: 600;
    }

    .settings-button:hover {
      background: var(--button-hover);
    }

    .settings-button:focus-visible {
      outline: 1px solid var(--focus);
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <div class="shell">
    <button class="settings-button" id="settingsBtn">设置</button>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    const settingsBtn = document.getElementById("settingsBtn");

    settingsBtn.addEventListener("click", () => {
      vscode.postMessage({ type: "openSettings" });
    });
  </script>
</body>
</html>`;
  }

  private buildErrorHtml(err: unknown): string {
    const message = err instanceof Error ? err.message : String(err);
    return /* html */ `<!DOCTYPE html>
<html lang="zh-CN">
<body>
  <p>CommentNovel 侧边栏加载失败。</p>
  <pre>${this.escapeHtml(message)}</pre>
</body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  private getNonce(): string {
    let text = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }
}
