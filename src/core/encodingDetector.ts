import * as iconv from "iconv-lite";
import { SupportedEncoding, EncodingDetectionResult } from "./types";

export class EncodingDetector {
  detect(buffer: Buffer): EncodingDetectionResult {
    const bomResult = this.detectBOM(buffer);
    if (bomResult) {
      return bomResult;
    }

    const utf8Valid = this.isValidUTF8(buffer);
    if (utf8Valid) {
      const decoded = buffer.toString("utf8");
      const score = this.scoreDecodedText(decoded);
      if (score.replacementCount === 0) {
        return {
          encoding: "utf8",
          confidence: score.chineseRatio > 0.1 ? "high" : "medium",
          reason: "Valid UTF-8 with normal character distribution",
        };
      }
    }

    const utf8Decoded = buffer.toString("utf8");
    const utf8Score = this.scoreDecodedText(utf8Decoded);

    let gbkDecoded: string;
    let gbkScore: ReturnType<typeof this.scoreDecodedText>;
    try {
      gbkDecoded = iconv.decode(buffer, "gbk");
      gbkScore = this.scoreDecodedText(gbkDecoded);
    } catch {
      gbkScore = {
        chineseRatio: 0,
        replacementCount: Infinity,
        controlCharRatio: 1,
      };
    }

    let gb2312Decoded: string;
    let gb2312Score: ReturnType<typeof this.scoreDecodedText>;
    try {
      gb2312Decoded = iconv.decode(buffer, "gb2312");
      gb2312Score = this.scoreDecodedText(gb2312Decoded);
    } catch {
      gb2312Score = {
        chineseRatio: 0,
        replacementCount: Infinity,
        controlCharRatio: 1,
      };
    }

    const bestGBK =
      gbkScore.replacementCount < gb2312Score.replacementCount
        ? { encoding: "gbk" as SupportedEncoding, score: gbkScore }
        : { encoding: "gb2312" as SupportedEncoding, score: gb2312Score };

    if (
      bestGBK.score.replacementCount < utf8Score.replacementCount &&
      bestGBK.score.chineseRatio > utf8Score.chineseRatio
    ) {
      const confidence =
        bestGBK.score.chineseRatio > 0.3
          ? "high"
          : bestGBK.score.chineseRatio > 0.1
            ? "medium"
            : "low";
      return {
        encoding: bestGBK.encoding,
        confidence,
        reason: `${bestGBK.encoding.toUpperCase()} decode produced fewer replacement characters and higher Chinese ratio`,
      };
    }

    if (utf8Valid) {
      return {
        encoding: "utf8",
        confidence: utf8Score.replacementCount > 0 ? "low" : "medium",
        reason: "UTF-8 is valid but may contain mojibake",
      };
    }

    return {
      encoding: "utf8",
      confidence: "low",
      reason: "Could not determine encoding, falling back to UTF-8",
    };
  }

  private detectBOM(buffer: Buffer): EncodingDetectionResult | null {
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return { encoding: "utf8", confidence: "high", reason: "UTF-8 BOM detected" };
    }
    return null;
  }

  private isValidUTF8(buffer: Buffer): boolean {
    let i = 0;
    while (i < buffer.length) {
      const byte = buffer[i];
      let remaining: number;

      if (byte <= 0x7f) {
        remaining = 0;
      } else if ((byte & 0xe0) === 0xc0) {
        remaining = 1;
      } else if ((byte & 0xf0) === 0xe0) {
        remaining = 2;
      } else if ((byte & 0xf8) === 0xf0) {
        remaining = 3;
      } else {
        return false;
      }

      if (i + remaining >= buffer.length) {
        return false;
      }

      for (let j = 0; j < remaining; j++) {
        if ((buffer[i + 1 + j] & 0xc0) !== 0x80) {
          return false;
        }
      }

      i += remaining + 1;
    }
    return true;
  }

  private scoreDecodedText(text: string): {
    chineseRatio: number;
    replacementCount: number;
    controlCharRatio: number;
  } {
    const total = text.length;
    if (total === 0) {
      return { chineseRatio: 0, replacementCount: 0, controlCharRatio: 0 };
    }

    let chineseCount = 0;
    let replacementCount = 0;
    let controlCharCount = 0;

    for (const char of text) {
      const code = char.charCodeAt(0);
      if (code >= 0x4e00 && code <= 0x9fff) {
        chineseCount++;
      } else if (code >= 0x3400 && code <= 0x4dbf) {
        chineseCount++;
      } else if (code === 0xfffd || char === "�") {
        replacementCount++;
      } else if (code < 0x20 && code !== 0x0a && code !== 0x0d && code !== 0x09) {
        controlCharCount++;
      }
    }

    return {
      chineseRatio: chineseCount / total,
      replacementCount,
      controlCharRatio: controlCharCount / total,
    };
  }
}
