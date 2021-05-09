import { ServerResponse } from "http";
import { promisify } from "util";
import { brotliCompress, constants, gzip as gzipCompress } from "zlib";
import encodeUrl from "encodeurl";
import httpError, { UnknownError } from "http-errors";
import { contentType, lookup } from "mime-types";
import type { Request } from "./request";

const brotli = promisify(brotliCompress);
const gzip = promisify(gzipCompress);

export class Response extends ServerResponse {
  request!: Request;
  redirect(url: string): void;
  redirect(statusCode: number, url: string): void;
  redirect(statusCode: any, url?: any) {
    if (url === undefined) {
      url = statusCode;
      statusCode = 302;
    }

    if (url === "back") {
      url = this.request.headers.referer || "/";
    }

    this.statusCode = statusCode;
    this.setHeader("location", encodeUrl(url));
    this.end();
  }
  type(value?: string | null) {
    switch (value) {
      case null:
      case "":
        this.removeHeader("content-type");
        break;
      case undefined:
        if (!this.hasHeader("content-type")) {
          let type: string | false = this.request.types[0];

          if (!type || type.includes("*")) {
            type = lookup(this.request.extname);
          }

          if (type) {
            type = contentType(type);
          }

          if (!type) {
            type = "text/plain; charset=utf-8";
          }

          if (type) {
            this.setHeader("content-type", type);
          }
        }

        break;
      default:
        if (typeof value === "string") {
          const type = contentType(value);

          if (type) {
            this.setHeader("content-type", type);
          }
        }

        break;
    }

    return this;
  }
  async send(data: string | Buffer) {
    if (typeof data === "string") {
      data = Buffer.from(data, "utf8");
    }

    const encodings = this.request.encodings;

    if (encodings.includes("br")) {
      data = await brotli(data, {
        params: {
          [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
          [constants.BROTLI_PARAM_QUALITY]: 5,
          [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
        },
      });

      this.setHeader("content-encoding", "br");
    } else if (encodings.includes("gzip")) {
      data = await gzip(data, {
        level: 8,
      });

      this.setHeader("content-encoding", "gzip");
    }

    this.type();
    this.setHeader("content-length", data.length.toString());
    this.end(data);
  }
  error(...args: UnknownError[]): never {
    throw httpError(...args);
  }
}

Response.prototype.request = null as any;
