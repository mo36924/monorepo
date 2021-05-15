import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { extname, join } from "path";
import { pathToFileURL } from "url";
import { promisify } from "util";
import { brotliCompress, constants } from "zlib";
import { gzipAsync } from "@gfx/zopfli";
import base64url from "@mo36924/base64url";
import glob from "fast-glob";
import { contentType } from "mime-types";
import type { Plugin, ResolvedId } from "rollup";

export type Options = {
  middleware?: string;
  prefix?: string;
  files?: { [path: string]: string | Buffer | { pathname?: string; hash?: string; data: string | Buffer } };
  source?: string | string[];
  dir?: string;
  ignore?: string[];
  headers?: { [key: string]: string };
};

const basePathname = pathToFileURL("./").pathname;

const normalize = (path: string) => {
  let pathname = pathToFileURL(path).pathname;

  if (pathname.startsWith(basePathname)) {
    pathname = pathname.slice(basePathname.length - 1);
  }

  return pathname;
};

const normalizePrefix = (prefix?: string | null | undefined) => {
  prefix ||= "/";

  if (!prefix.startsWith("/")) {
    prefix = `/${prefix}`;
  }

  if (prefix.endsWith("/")) {
    prefix = prefix.slice(0, -1);
  }

  return prefix;
};

const etagHash = (data: Buffer) => base64url(createHash("md5").update(data).digest("base64"));
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

const isText = (extname: string) => {
  switch (extname) {
    case ".css":
    case ".html":
    case ".js":
    case ".svg":
      return true;
    default:
      return false;
  }
};

const getCacheCode = async (options: Options): Promise<string> => {
  const prefix = normalizePrefix(options.prefix);

  const files = Object.assign(
    Object.create(null) as {},
    Object.fromEntries(
      Object.entries(options.files ?? {}).map(([path, data]) => [
        normalize(typeof data === "string" || Buffer.isBuffer(data) ? path : data.pathname ?? path),
        typeof data === "string" || Buffer.isBuffer(data)
          ? Buffer.from(data)
          : {
              pathname: normalize(data.pathname ?? path),
              hash: data.hash ?? etagHash(Buffer.from(data.data)),
              data: Buffer.from(data.data),
            },
      ]),
    ),
  );

  const caches: string[] = [];

  if (options.source) {
    const paths = await glob(options.source, { cwd: options.dir, onlyFiles: true, dot: false, ignore: options.ignore });
    caches.push(...paths.map(normalize));
  }

  const paths = [...new Set([...Object.keys(files), ...caches])].sort();

  const codes = await Promise.all(
    paths.map(async (path) => {
      const file = files[path] ?? (await readFile(join(options.dir ?? ".", path)));
      const pathname = Buffer.isBuffer(file) ? path : file.pathname;
      const hash = Buffer.isBuffer(file) ? etagHash(file) : file.hash;
      const data = Buffer.isBuffer(file) ? file : file.data;
      const jsonPath = JSON.stringify(prefix + pathname);
      const _extname = extname(path);
      const _contentType = contentType(_extname) || undefined;
      const etag = `W/"${hash}"`;

      const headers = {
        "cache-control": undefined,
        "content-encoding": undefined,
        "content-length": data.length.toString(),
        "content-type": _contentType,
        etag,
        ...options.headers,
      };

      const identityHeaders = JSON.stringify(headers);

      if (isText(_extname)) {
        const [br, _gzip] = await Promise.all([brotli(data), gzip(data)]);

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
          identity: [${identityHeaders}, Buffer.from("${data.toString("base64")}", "base64")],
        }`;
      } else {
        return `${jsonPath}: {
          identity: [${identityHeaders}, Buffer.from("${data.toString("base64")}", "base64")],
        }`;
      }
    }),
  );

  if (!codes.length) {
    return "";
  }

  return `Object.assign(Object.create(null),{${codes.join()}});`;
};

const getCacheMiddlewareCode = async (options: Options) => {
  const cacheCode = await getCacheCode(options);

  if (!cacheCode) {
    return "export default () => () => {};";
  }

  const prefix = normalizePrefix(options.prefix);

  let checkPrefixCode = "";

  if (prefix !== "/") {
    checkPrefixCode = `
  if (!request.url?.startsWith(${JSON.stringify(prefix)})) {
    return;
  }
`;
  }

  return `const cache = ${cacheCode};
export default () => () => (request, response) => {
  if (request.method !== "GET" && request.method !== "POST") {
    return;
  }
  ${checkPrefixCode}
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
};
`;
};

export default (options: Options = {}): Required<Pick<Plugin, "name" | "buildStart" | "load">> => {
  const middleware = options.middleware ?? "@mo36924/cache-middleware";
  const _options = { ...options, middleware };
  let resolvedId: ResolvedId | null = null;
  let code: string | undefined;
  return {
    name: "cache",
    async buildStart() {
      resolvedId = await this.resolve(middleware, undefined, { skipSelf: true });
    },
    async load(id) {
      if (id === resolvedId?.id) {
        code ??= await getCacheMiddlewareCode(_options);
        return code;
      }
    },
  };
};
