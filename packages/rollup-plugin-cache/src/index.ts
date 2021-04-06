import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { extname, join, sep } from "path";
import { promisify } from "util";
import { brotliCompress, constants } from "zlib";
import { gzipAsync } from "@gfx/zopfli";
import base64url from "@mo36924/base64url";
import glob from "fast-glob";
import { contentType } from "mime-types";
import type { Plugin, ResolvedId } from "rollup";

const cwd = process.cwd() + sep;

export type Options = {
  middleware?: string;
  prefix?: string;
  files?: { [path: string]: string | Buffer };
  source?: string | string[];
  dir?: string;
  ignore?: string[];
  headers?: { [key: string]: string };
};

const normalize = (path: string) => {
  if (path.startsWith(cwd)) {
    path = path.slice(cwd.length);
  }

  path = path.split(sep).join("/");

  if (path[0] === "/") {
    path = path.slice(1);
  }

  return path;
};

const normalizePrefix = (prefix?: string | null | undefined) => {
  prefix ||= "/";

  if (prefix[0] !== "/") {
    prefix = `/${prefix}`;
  }

  if (prefix[prefix.length - 1] !== "/") {
    prefix = `${prefix}/`;
  }

  return prefix;
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

const getCacheMiddlewareCode = (options: Options & { middlewareVirtual: string }) => {
  const prefix = normalizePrefix(options.prefix);

  let checkPrefixCode = "";

  if (prefix !== "/") {
    checkPrefixCode = `
    if (!request.path.startsWith(${JSON.stringify(prefix)})) {
      return;
    }
`;
  }

  return `export default () => async () => {
  const { default: cache } = await import(${JSON.stringify(options.middlewareVirtual)});

  return (request, response) => {
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
    return true;
  };
};
`;
};

const getCacheMiddlewareVirtualCode = async (options: Options): Promise<string> => {
  const prefix = normalizePrefix(options.prefix);

  const files: { [path: string]: Buffer } = Object.assign(
    Object.create(null),
    Object.fromEntries(Object.entries(options.files ?? {}).map(([path, data]) => [normalize(path), Buffer.from(data)])),
  );

  const caches: string[] = [];

  if (options.source) {
    const paths = await glob(options.source, { cwd: options.dir, onlyFiles: true, dot: false, ignore: options.ignore });
    caches.push(...paths.map(normalize));
  }

  const paths = [...new Set([...Object.keys(files), ...caches])].sort();

  const codes = await Promise.all(
    paths.map(async (path) => {
      const data = files[path] ?? (await readFile(join(options.dir ?? ".", path)));
      const jsonPath = JSON.stringify(prefix + path);
      const _extname = extname(path);
      const _contentType = contentType(_extname) || undefined;
      const hash = base64url(createHash("sha256").update(data).digest("base64"));
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

  const code = `export default Object.assign(Object.create(null),{${codes.join()}});`;
  return code;
};

export default (options: Options = {}): Required<Pick<Plugin, "name" | "buildStart" | "resolveId" | "load">> => {
  const files: { [id: string]: string | Promise<string> } = Object.create(null);
  const middleware = options.middleware ?? "@mo36924/cache-middleware";
  const middlewareVirtual = `\0${middleware}`;
  const _options = { ...options, middleware, middlewareVirtual };
  let resolvedId: ResolvedId | null = null;
  return {
    name: "cache",
    async buildStart() {
      resolvedId = await this.resolve(middleware, undefined, { skipSelf: true });
    },
    resolveId(source) {
      if (source === middleware) {
        return resolvedId;
      }

      if (source === middlewareVirtual) {
        return middlewareVirtual;
      }
    },
    load(id) {
      if (id === resolvedId?.id) {
        return (files[id] ??= getCacheMiddlewareCode(_options));
      }

      if (id === middlewareVirtual) {
        return (files[id] ??= getCacheMiddlewareVirtualCode(_options));
      }
    },
  };
};
