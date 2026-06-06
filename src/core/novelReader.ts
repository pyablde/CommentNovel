import * as fs from "fs";
import * as iconv from "iconv-lite";
import { SupportedEncoding } from "./types";

export class NovelReader {
  readAndDecode(filePath: string, encoding: SupportedEncoding): string {
    const buffer = fs.readFileSync(filePath);
    return this.decode(buffer, encoding);
  }

  decode(buffer: Buffer, encoding: SupportedEncoding): string {
    let text: string;
    if (encoding === "utf8") {
      text = buffer.toString("utf8");
    } else {
      text = iconv.decode(buffer, encoding);
    }
    return this.cleanText(text);
  }

  readSlice(
    filePath: string,
    encoding: SupportedEncoding,
    offset: number,
    length: number
  ): { text: string; actualLength: number } {
    const fullText = this.readAndDecode(filePath, encoding);
    const slice = fullText.substring(offset, offset + length);
    return {
      text: slice,
      actualLength: slice.length,
    };
  }

  private cleanText(text: string): string {
    let cleaned = text;

    if (cleaned.charCodeAt(0) === 0xfeff) {
      cleaned = cleaned.substring(1);
    }

    cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");

    cleaned = cleaned.replace(/\r\n/g, "\n");
    cleaned = cleaned.replace(/\r/g, "\n");

    return cleaned;
  }
}
