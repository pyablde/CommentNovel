import { SupportedLanguage } from "../core/types";
import { GenerateLineContext } from "../core/types";

export interface LanguageGenerator {
  readonly language: SupportedLanguage;
  readonly fileExtension: string;
  readonly lineCommentPrefix: string;
  generateLine(context: GenerateLineContext): string;
  generateCodeLine(lineNumber: number): string;
  formatNovelComment(text: string): string;
  formatNoiseComment(text: string): string;
  getNoiseComment(lineNumber: number): string;
}
