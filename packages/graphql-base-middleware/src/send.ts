import { promisify } from "util";
import { brotliCompress, constants, gzip as gzipCompress } from "zlib";
import accepts from "accepts";
import type { Send } from "./type";

const brotli = promisify(brotliCompress);
const gzip = promisify(gzipCompress);

export const send: Send = async (req, res, result) => {
  const accept = accepts(req);
  const encoding = accept.encodings(["br", "gzip"]);
  const json = result.raw === undefined ? JSON.stringify(result) : result.raw;
  let chunk = Buffer.from(json, "utf8");

  if (encoding === "br") {
    chunk = await brotli(chunk, {
      params: {
        [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
        [constants.BROTLI_PARAM_QUALITY]: 5,
        [constants.BROTLI_PARAM_SIZE_HINT]: chunk.length,
      },
    });

    res.setHeader("Content-Encoding", "br");
  } else if (encoding === "gzip") {
    chunk = await gzip(chunk, {
      level: 8,
    });

    res.setHeader("Content-Encoding", "gzip");
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Content-Length", chunk.length.toString());
  res.end(chunk);
};
