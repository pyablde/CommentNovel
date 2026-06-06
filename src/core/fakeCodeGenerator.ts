import { GenerateInput, GenerateOutput, SupportedLanguage } from "./types";
import { TextChunker } from "./textChunker";
import { LanguageGenerator } from "../languages/base";
import { TypeScriptGenerator } from "../languages/typescriptGenerator";
import { PythonGenerator } from "../languages/pythonGenerator";

export class FakeCodeGenerator {
  private readonly generators: Map<SupportedLanguage, LanguageGenerator>;
  private readonly chunker: TextChunker;

  constructor() {
    this.chunker = new TextChunker();
    this.generators = new Map();
    this.generators.set("typescript", new TypeScriptGenerator());
    this.generators.set("python", new PythonGenerator());
  }

  generate(input: GenerateInput): GenerateOutput {
    const generator = this.generators.get(input.language);
    if (!generator) {
      throw new Error(`Unsupported language: ${input.language}`);
    }

    const lines: string[] = [];
    let currentOffset = input.novelOffset;
    let novelCommentCount = 0;
    let novelExhausted = false;

    for (let i = 0; i < input.pageSize; i++) {
      const isNovelLine = !novelExhausted && (i % input.commentEveryLines === input.commentEveryLines - 1);

      if (isNovelLine) {
        const chunk = this.chunker.chunk(
          input.novelText,
          currentOffset,
          input.wordsPerComment
        );

        if (chunk.text.length === 0) {
          novelExhausted = true;
          lines.push(generator.generateCodeLine(i));
        } else {
          lines.push(
            generator.generateLine({
              lineNumber: i,
              isNovelCommentLine: true,
              novelChunk: chunk.text,
              isNoiseCommentLine: false,
            })
          );
          currentOffset = chunk.newOffset;
          novelCommentCount++;
        }
      } else {
        const isNoise =
          !isNovelLine &&
          this.shouldAddNoise(i, input.noiseCommentRatio);

        lines.push(
          generator.generateLine({
            lineNumber: i,
            isNovelCommentLine: false,
            isNoiseCommentLine: isNoise,
            noiseComment: isNoise
              ? generator.getNoiseComment(i)
              : undefined,
          })
        );
      }
    }

    return {
      code: lines.join("\n"),
      startOffset: input.novelOffset,
      endOffset: currentOffset,
      insertedNovelComments: novelCommentCount,
    };
  }

  getGenerator(language: SupportedLanguage): LanguageGenerator | undefined {
    return this.generators.get(language);
  }

  private shouldAddNoise(lineNumber: number, ratio: number): boolean {
    const x = Math.sin(lineNumber * 9301 + 49297) * 49297;
    return (x - Math.floor(x)) < ratio;
  }
}
