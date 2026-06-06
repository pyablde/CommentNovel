import { SupportedLanguage, GenerateLineContext } from "../core/types";
import { LanguageGenerator } from "./base";

const VAR_NAMES = [
  "config", "result", "handler", "service", "client", "provider", "manager",
  "adapter", "factory", "builder", "validator", "parser", "serializer",
  "cache", "pool", "queue", "buffer", "registry", "controller", "middleware",
];

const FUNC_NAMES = [
  "initialize", "process", "validate", "transform", "execute", "resolve",
  "handle", "configure", "register", "dispatch", "emit", "subscribe",
  "fetch", "update", "remove", "create", "destroy", "reset", "sync",
];

const TYPE_NAMES = [
  "Config", "Options", "Result", "Response", "Request", "State", "Event",
  "Context", "Session", "Record", "Entry", "Entity", "Model", "View",
];

const NOISE_COMMENTS = [
  "Type guard for runtime validation",
  "Ensures backward compatibility with v2 API",
  "Memoized for performance in hot paths",
  "Handles edge case from issue #342",
  "Deprecated — will be removed in next major version",
  "Thread-safe implementation",
  "Following the observer pattern here",
  "Required by the plugin lifecycle",
  "Defensive copy to prevent external mutation",
  "Matches the upstream contract specification",
];

export class TypeScriptGenerator implements LanguageGenerator {
  readonly language: SupportedLanguage = "typescript";
  readonly fileExtension = ".ts";
  readonly lineCommentPrefix = "//";

  private seed = 42;

  generateLine(context: GenerateLineContext): string {
    if (context.isNovelCommentLine && context.novelChunk) {
      return this.formatNovelComment(context.novelChunk);
    }
    if (context.isNoiseCommentLine && context.noiseComment) {
      return this.formatNoiseComment(context.noiseComment);
    }
    return this.generateCodeLine(context.lineNumber);
  }

  formatNovelComment(text: string): string {
    return `// ${text}`;
  }

  formatNoiseComment(text: string): string {
    return `// ${text}`;
  }

  generateCodeLine(lineNumber: number): string {
    const roll = this.pseudoRandom(lineNumber);

    if (roll < 0.08) {
      return "";
    }
    if (roll < 0.2) {
      return this.generateInterface(lineNumber);
    }
    if (roll < 0.35) {
      return this.generateTypeAlias(lineNumber);
    }
    if (roll < 0.55) {
      return this.generateFunctionSignature(lineNumber);
    }
    if (roll < 0.7) {
      return this.generateVariable(lineNumber);
    }
    if (roll < 0.82) {
      return this.generateImport(lineNumber);
    }
    if (roll < 0.9) {
      return this.generateExport(lineNumber);
    }
    return this.generateBraceOrBlock(lineNumber);
  }

  getNoiseComment(lineNumber: number): string {
    const index = this.pseudoRandom(lineNumber) * NOISE_COMMENTS.length | 0;
    return NOISE_COMMENTS[index % NOISE_COMMENTS.length];
  }

  private generateInterface(lineNumber: number): string {
    const name = this.pick(TYPE_NAMES, lineNumber);
    const prop = this.pick(VAR_NAMES, lineNumber + 3);
    const type = this.pick(["string", "number", "boolean", "unknown"], lineNumber + 7);
    return `interface ${name} { ${prop}: ${type}; }`;
  }

  private generateTypeAlias(lineNumber: number): string {
    const name = this.pick(TYPE_NAMES, lineNumber + 1);
    const base = this.pick(["string", "number", "Record<string, unknown>"], lineNumber + 5);
    return `type ${name} = ${base};`;
  }

  private generateFunctionSignature(lineNumber: number): string {
    const name = this.pick(FUNC_NAMES, lineNumber + 2);
    const param = this.pick(VAR_NAMES, lineNumber + 4);
    const retType = this.pick(["void", "Promise<void>", "boolean", "string"], lineNumber + 6);
    return `function ${name}(${param}: ${retType}): ${retType} {`;
  }

  private generateVariable(lineNumber: number): string {
    const name = this.pick(VAR_NAMES, lineNumber + 8);
    const keyword = this.pseudoRandom(lineNumber + 9) > 0.5 ? "const" : "let";
    const value = this.generateValue(lineNumber);
    return `${keyword} ${name} = ${value};`;
  }

  private generateImport(lineNumber: number): string {
    const module = this.pick(["./core", "./utils", "./config", "./types", "../services"], lineNumber + 10);
    const name = this.pick(VAR_NAMES, lineNumber + 11);
    return `import { ${name} } from "${module}";`;
  }

  private generateExport(lineNumber: number): string {
    const name = this.pick(VAR_NAMES, lineNumber + 12);
    return `export { ${name} };`;
  }

  private generateBraceOrBlock(lineNumber: number): string {
    if (this.pseudoRandom(lineNumber + 13) > 0.5) {
      return "}";
    }
    return "  // ...";
  }

  private generateValue(lineNumber: number): string {
    const roll = this.pseudoRandom(lineNumber + 20);
    if (roll < 0.25) return `"${this.pick(["default", "config", "handler", "service"], lineNumber)}"`;
    if (roll < 0.5) return String((this.pseudoRandom(lineNumber + 21) * 100) | 0);
    if (roll < 0.75) return "true";
    return "{}";
  }

  private pick<T>(arr: T[], seed: number): T {
    return arr[Math.abs(this.pseudoRandom(seed) * arr.length) | 0];
  }

  private pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297 + this.seed) * 49297;
    return x - Math.floor(x);
  }
}
