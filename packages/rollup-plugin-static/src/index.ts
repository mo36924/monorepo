import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { extname, resolve, sep } from "path";
import { promisify } from "util";
import { brotliCompress, constants } from "zlib";
import { gzipAsync } from "@gfx/zopfli";
import base64url from "@mo36924/base64url";
import glob from "fast-glob";
import { charset, contentType } from "mime-types";
import type { Plugin } from "rollup";

export type Options = { [path: string]: string };

const normalize = (path: string) => {
  path = path.split(sep).join("/");

  if (path[0] !== "/") {
    path = `/${path}`;
  }

  return path;
};

const brotliAsync = promisify(brotliCompress);

const brotli = (buffer: Buffer) =>
  brotliAsync(buffer, {
    params: {
      [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
      [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY,
      [constants.BROTLI_PARAM_SIZE_HINT]: buffer.length,
    },
  });

const gzip = (buffer: Buffer) => gzipAsync(buffer, {}).then(Buffer.from);

const staticMiddleWarePath = resolve("node_modules/@mo36924/static-middleware/dist/index.js");
const staticMiddleWareCachePath = `\0${staticMiddleWarePath}`;

const staticMiddleWareCode = `export default () => async () => {
  const { default: cache } = import(${JSON.stringify(staticMiddleWareCachePath)});

  return async (request, response) => {
    if (request.method !== "GET" && request.method !== "POST") {
      return;
    }

    const value = cache[request.pathname];

    if (value === undefined) {
      return;
    }

    if (value.identity[0].etag === request.headers["if-none-match"]) {
      response.writeHead(304).end();
      return true;
    }

    let _response;

    if (value.br && request.encoding("br")) {
      _response = value.br;
    } else if (value.gzip && request.encoding("gzip")) {
      _response = value.gzip;
    } else {
      _response = value.identity;
    }

    response.writeHead(200, _response[0]).end(_response[1]);
    return true;
  };
};
`;

const getStaticMiddleWareCacheCode = async (files: { [path: string]: string }): Promise<string> => {
  const fileBuffers: { [path: string]: Buffer } = Object.fromEntries(
    Object.entries(files).map(([path, data]) => [normalize(path), Buffer.from(data)]),
  );

  const filePaths = Object.keys(fileBuffers);
  const staticPaths = [...(await glob("**/*", { cwd: "static", onlyFiles: true, dot: false })).map(normalize)];
  const paths = [...new Set([...filePaths, ...staticPaths])].sort();

  const codes = await Promise.all(
    paths.map(async (path) => {
      const fileBuffer = fileBuffers[path];
      const staticBuffer = staticPaths.includes(path) && (await readFile(`static/${path}`));
      let buffer: Buffer;

      if (fileBuffer && staticBuffer) {
        buffer = Buffer.from(`${fileBuffer.toString()}\n${staticBuffer.toString()}`);
      } else if (staticBuffer) {
        buffer = staticBuffer;
      } else {
        buffer = fileBuffer;
      }

      const jsonPath = JSON.stringify(path);
      const _extname = extname(path);
      const _contentType = contentType(_extname) || undefined;
      const _charset = fileBuffer ? "utf-8" : (charset(_contentType || "") || "").toLowerCase();
      const md5 = base64url(createHash("md5").update(buffer).digest("base64"));
      const etag = `W/"${md5}"`;

      const headers = {
        "content-encoding": undefined,
        "content-length": buffer.length.toString(),
        "content-type": _contentType,
        etag,
      };

      const identityHeaders = JSON.stringify(headers);

      if (_charset === "utf-8") {
        const [br, _gzip] = await Promise.all([brotli(buffer), gzip(buffer)]);

        const brHeaders = JSON.stringify({
          ...headers,
          "content-encoding": "br",
          "content-length": br.length.toString(),
        });

        const gzipHeaders = JSON.stringify({
          ...headers,
          "content-encoding": "gzip",
          "content-length": _gzip.length.toString(),
        });

        return `${jsonPath}: {
          br: [${brHeaders}, Buffer.from("${br.toString("base64")}", "base64")],
          gzip: [${gzipHeaders}, Buffer.from("${_gzip.toString("base64")}", "base64")],
          identity: [${identityHeaders}, Buffer.from("${buffer.toString("base64")}", "base64")],
        }`;
      } else {
        return `${jsonPath}: {
          identity: [${identityHeaders}, Buffer.from("${buffer.toString("base64")}", "base64")],
        }`;
      }
    }),
  );

  const code = `export default Object.assign(Object.create(null),{${codes.join()}});`;
  return code;
};

export default (files: { [path: string]: string } = {}): Plugin => {
  const promise = getStaticMiddleWareCacheCode(files);
  return {
    name: "static",
    load(id) {
      if (id === staticMiddleWarePath) {
        return staticMiddleWareCode;
      }

      if (id === staticMiddleWareCachePath) {
        return promise;
      }
    },
  };
};
