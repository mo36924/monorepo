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
  _type!: string | null;
  get type() {
    if (this._type === null) {
      let type: string | false = this.request.types[0];

      if (!type || type.includes("*")) {
        type = lookup(this.request.ext);
      }

      if (type) {
        type = contentType(type);
      }

      if (!type) {
        type = "text/plain; charset=utf-8";
      }

      this._type = type;
    }

    return this._type;
  }
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
  set type(value: string) {
    this._type = contentType(value) || null;
  }
  async send(data: string | Buffer, type?: string) {
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

    this.setHeader("content-type", (type && contentType(type)) || this.type);
    this.setHeader("content-length", data.length.toString());
    this.end(data);
  }
  error(...args: UnknownError[]): never {
    throw httpError(...args);
  }
}

Response.prototype.request = null as any;
Response.prototype._type = null;
