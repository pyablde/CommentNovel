export interface ChunkResult {
  text: string;
  newOffset: number;
}

export class TextChunker {
  chunk(
    novelText: string,
    offset: number,
    wordsPerComment: number
  ): ChunkResult {
    if (offset >= novelText.length) {
      return { text: "", newOffset: offset };
    }

    const remaining = novelText.substring(offset);
    let text = this.extractChunk(remaining, wordsPerComment);

    if (text.trim().length === 0) {
      const skipped = this.skipWhitespace(remaining);
      if (skipped.length === 0) {
        return { text: "", newOffset: novelText.length };
      }
      text = this.extractChunk(skipped, wordsPerComment);
      return {
        text: text.trim(),
        newOffset: offset + (remaining.length - skipped.length) + text.length,
      };
    }

    return {
      text: text.trim(),
      newOffset: offset + text.length,
    };
  }

  private extractChunk(text: string, maxWords: number): string {
    let count = 0;
    let end = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === "\n" || char === "\r") {
        return count > 0 ? text.substring(0, i) : text.substring(0, i + 1);
      }

      if (this.isPunctuation(char)) {
        end = i + 1;
        count++;
        if (count >= maxWords) {
          return text.substring(0, end);
        }
        continue;
      }

      if (this.isChinese(char)) {
        count++;
        end = i + 1;
        if (count >= maxWords) {
          return text.substring(0, end);
        }
        continue;
      }

      if (/[a-zA-Z0-9]/.test(char)) {
        count++;
        if (i + 1 >= text.length || !/[a-zA-Z0-9]/.test(text[i + 1])) {
          end = i + 1;
          if (count >= maxWords) {
            return text.substring(0, end);
          }
        } else if (count >= maxWords) {
          end = i + 1;
          return text.substring(0, end);
        }
        continue;
      }

      if (/\s/.test(char)) {
        if (count > 0) {
          end = i;
          if (count >= maxWords) {
            return text.substring(0, end);
          }
        }
        continue;
      }

      count++;
      end = i + 1;
      if (count >= maxWords) {
        return text.substring(0, end);
      }
    }

    return text.substring(0, end || text.length);
  }

  private skipWhitespace(text: string): string {
    let i = 0;
    while (i < text.length && /\s/.test(text[i])) {
      i++;
    }
    return text.substring(i);
  }

  private isChinese(char: string): boolean {
    const code = char.charCodeAt(0);
    return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf);
  }

  private isPunctuation(char: string): boolean {
    const code = char.charCodeAt(0);
    if (code >= 0x3000 && code <= 0x303f) return true;
    if (code >= 0xff00 && code <= 0xffef) return true;
    if (".!?;:".includes(char)) return true;
    if (char === ",") return true;
    // CJK punctuation by code point
    return this.isCjkPunctuation(code);
  }

  private isCjkPunctuation(code: number): boolean {
    // 、 、  。 。  ！ ！  ？ ？  ； ；  ： ：
    // “ “  ” “  ‘ ‘  ’ ‘
    // （ （  ） ）  【 【  】 】
    // 《 《  》 》  … …  — —  · ·
    switch (code) {
      case 0x3001: case 0x3002: case 0xff01: case 0xff1f:
      case 0xff1b: case 0xff1a:
      case 0x201c: case 0x201d: case 0x2018: case 0x2019:
      case 0xff08: case 0xff09: case 0x3010: case 0x3011:
      case 0x300a: case 0x300b: case 0x2026: case 0x2014:
      case 0x00b7:
        return true;
      default:
        return false;
    }
  }
}
