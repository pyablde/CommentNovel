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

1. `Ctrl+Shift+P` 打开命令面板
2. 运行 **CommentNovel: Import Novel**，选择 `.txt` 或 `.md` 小说文件
3. 运行 **CommentNovel: Open Fake Code**，开始阅读
4. 用 **Next Page** / **Previous Page** 翻页

## 命令

| 命令 | 说明 |
|------|------|
| `CommentNovel: Import Novel` | 导入小说文件 |
| `CommentNovel: Open Fake Code` | 打开虚拟代码文档 |
| `CommentNovel: Next Page` | 下一页 |
| `CommentNovel: Previous Page` | 上一页 |
| `CommentNovel: Reset Progress` | 重置阅读进度 |
| `CommentNovel: Switch Language` | 切换伪装语言 |
| `CommentNovel: Open Settings` | 打开设置页面 |

## 配置项

| 设置 | 默认值 | 说明 |
|------|--------|------|
| `commentNovel.language` | `typescript` | 伪装代码语言 |
| `commentNovel.wordsPerComment` | `18` | 每条注释的小说字数（1–200） |
| `commentNovel.commentEveryLines` | `5` | 每隔几行代码插入一条注释（1–50） |
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
