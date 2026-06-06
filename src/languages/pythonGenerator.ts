import { SupportedLanguage, GenerateLineContext } from "../core/types";
import { LanguageGenerator } from "./base";

const PY_VAR_NAMES = [
  "config", "result", "handler", "service", "client", "provider", "manager",
  "adapter", "factory", "builder", "validator", "parser", "serializer",
  "cache", "pool", "queue", "buffer", "registry", "controller", "data",
];

const PY_FUNC_NAMES = [
  "initialize", "process", "validate", "transform", "execute", "resolve",
  "handle", "configure", "register", "dispatch", "emit", "subscribe",
  "fetch_data", "update_record", "remove_item", "create_instance", "reset_state",
];

const PY_CLASS_NAMES = [
  "Config", "Options", "Result", "Response", "Request", "State", "Event",
  "Context", "Session", "Record", "Entry", "Entity", "Model", "BaseHandler",
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

export class PythonGenerator implements LanguageGenerator {
  readonly language: SupportedLanguage = "python";
  readonly fileExtension = ".py";
  readonly lineCommentPrefix = "#";

  private seed = 73;

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
    return `# ${text}`;
  }

  formatNoiseComment(text: string): string {
    return `# ${text}`;
  }

  generateCodeLine(lineNumber: number): string {
    const roll = this.pseudoRandom(lineNumber);

    if (roll < 0.08) {
      return "";
    }
    if (roll < 0.2) {
      return this.generateClassDef(lineNumber);
    }
    if (roll < 0.35) {
      return this.generateFunctionDef(lineNumber);
    }
    if (roll < 0.5) {
      return this.generateAssignment(lineNumber);
    }
    if (roll < 0.65) {
      return this.generateImport(lineNumber);
    }
    if (roll < 0.78) {
      return this.generateDecorator(lineNumber);
    }
    if (roll < 0.88) {
      return this.generateReturnOrPass(lineNumber);
    }
    return this.generateIndentOrBlock(lineNumber);
  }

  getNoiseComment(lineNumber: number): string {
    const index = this.pseudoRandom(lineNumber) * NOISE_COMMENTS.length | 0;
    return NOISE_COMMENTS[index % NOISE_COMMENTS.length];
  }

  private generateClassDef(lineNumber: number): string {
    const name = this.pick(PY_CLASS_NAMES, lineNumber);
    if (this.pseudoRandom(lineNumber + 30) > 0.5) {
      return `class ${name}:`;
    }
    return `class ${name}(BaseHandler):`;
  }

  private generateFunctionDef(lineNumber: number): string {
    const name = this.pick(PY_FUNC_NAMES, lineNumber + 1);
    const param = this.pick(PY_VAR_NAMES, lineNumber + 4);
    if (this.pseudoRandom(lineNumber + 31) > 0.6) {
      return `def ${name}(self, ${param}):`;
    }
    return `def ${name}(${param}):`;
  }

  private generateAssignment(lineNumber: number): string {
    const name = this.pick(PY_VAR_NAMES, lineNumber + 8);
    const value = this.generateValue(lineNumber);
    return `${name} = ${value}`;
  }

  private generateImport(lineNumber: number): string {
    if (this.pseudoRandom(lineNumber + 10) > 0.5) {
      const module = this.pick(["os", "sys", "json", "logging", "typing", "abc"], lineNumber + 10);
      return `import ${module}`;
    }
    const module = this.pick(["core.utils", "core.config", "core.types", "services.base"], lineNumber + 10);
    const name = this.pick(PY_VAR_NAMES, lineNumber + 11);
    return `from ${module} import ${name}`;
  }

  private generateDecorator(lineNumber: number): string {
    const deco = this.pick(["staticmethod", "classmethod", "property", "abstractmethod"], lineNumber + 12);
    return `@${deco}`;
  }

  private generateReturnOrPass(lineNumber: number): string {
    if (this.pseudoRandom(lineNumber + 13) > 0.5) {
      return "return result";
    }
    return "pass";
  }

  private generateIndentOrBlock(lineNumber: number): string {
    if (this.pseudoRandom(lineNumber + 14) > 0.5) {
      return "    # ...";
    }
    return "";
  }

  private generateValue(lineNumber: number): string {
    const roll = this.pseudoRandom(lineNumber + 20);
    if (roll < 0.25) return `"${this.pick(["default", "config", "handler", "service"], lineNumber)}"`;
    if (roll < 0.5) return String((this.pseudoRandom(lineNumber + 21) * 100) | 0);
    if (roll < 0.75) return "True";
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
