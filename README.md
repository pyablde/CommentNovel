# CommentNovel

在代码注释中隐藏小说内容，让你看起来像是在写代码，实际上是在看小说。

## 功能

- 生成假代码文件，小说内容嵌入在代码注释中
- 支持 TypeScript、JavaScript、Python、Java、C++、Go 等伪装语言
- 自动检测文件编码（UTF-8 / GBK / GB2312）
- 翻页导航，支持前进和后退
- 阅读进度自动保存，跨重启恢复
- 可视化设置页面，自由调整参数

## 快速开始

1. 点击活动栏中的 **CommentNovel** 图标打开侧边栏
2. 点击右上角设置按钮，在设置页配置 **读取小说目录**
3. 回到侧边栏，在 **本地** 列表中选择 `.txt` 或 `.md` 小说
4. 点击 **运行** 打开伪装代码界面
5. 使用快捷键或命令执行 **上一页** / **下一页** 翻页

## 操作入口

侧边栏显示读取小说目录中的本地小说，右上角设置按钮会打开插件设置，底部 **运行** 按钮会导入当前选中的小说并打开伪装代码。也可以从命令面板运行导入、打开伪装代码、重置进度和打开设置命令。

设置页中的 **翻页快捷键** 可以打开 VS Code 快捷键配置，并定位到内部翻页命令：

| 内部命令 | 说明 |
|------|------|
| `CommentNovel.previousPage` | 上一页 |
| `CommentNovel.nextPage` | 下一页 |

## 配置项

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `commentNovel.novelDirectory` | `""` | 导入小说时默认打开的目录 |
| `commentNovel.language` | `typescript` | 伪装代码语言 |
| `commentNovel.wordsPerComment` | `12` | 每条注释的小说字数（1–200） |
| `commentNovel.novelCommentLines` | `1000` | 每页最多显示的小说注释行数（1–1000） |
| `commentNovel.commentEveryLines` | `12` | 每隔几行代码插入一条注释（1–50） |
| `commentNovel.pageSize` | `160` | 每页代码行数（30–1000） |
| `commentNovel.noiseCommentRatio` | `0.15` | 噪音注释占比（0–1） |

## 效果示例

```
import { config } from "./core";
// 许仙连忙让进屋内，白娘子端上茶来
function initialize() {
  // 许仙道："娘子，这药方当真有用吗？"
  return transform(options);
}
// 白娘子微微一笑："官人放心"
const handler = createHandler();
```

## 工作原理

CommentNovel 使用 VS Code 的 `TextDocumentContentProvider` 生成虚拟文档，不会在你的项目中创建任何真实文件。小说文本被切片后嵌入到自动生成的代码注释中，代码结构看起来像真实的源代码。

## 要求

- VS Code 1.85 或更高版本

## 许可证

MIT
