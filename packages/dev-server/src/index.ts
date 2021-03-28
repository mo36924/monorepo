import { readFile } from "fs/promises";
import { createServer } from "http";
import { extname } from "path";
import process from "process";
import { fileURLToPath, pathToFileURL } from "url";
import { isMainThread, parentPort, Worker } from "worker_threads";
import { transformAsync } from "@babel/core";
import type { Options as InjectOptions } from "@mo36924/babel-plugin-inject";
import babelPresetApp, { Options as babelPresetAppOptions } from "@mo36924/babel-preset-app";
import httpProxy from "http-proxy";
import reserved from "reserved-words";
import ts from "typescript";

type Cache = { [path: string]: string | null };
type Resolve = (
  specifier: string,
  context: { parentURL?: string; conditions: string[] },
  defaultResolve: Resolve,
) => Promise<{ url: string }>;
type GetFormat = (url: string, context: { format: string }, defaultGetSource: GetFormat) => Promise<{ format: string }>;
type GetSource = (url: string, context: { format: string }, defaultGetSource: GetSource) => Promise<{ source: string }>;

export type Options = {
  inject?: InjectOptions;
};

let _default: (options?: Options) => Promise<void>;
let resolve: Resolve;
let getFormat: GetFormat;
let getSource: GetSource;

resolve = getFormat = getSource = _default = async () => {
  throw new Error(`Not support ${isMainThread ? "main" : "worker"} thread`);
};

if (isMainThread) {
  _default = async (options: Options = {}) => {
    const serverInput = ts.sys.fileExists("server/index.ts") ? "server/index.ts" : "server/index.tsx";
    const clientInput = ts.sys.fileExists("client/index.ts") ? "client/index.ts" : "client/index.tsx";
    const redirectHeaders = { location: pathToFileURL(clientInput).pathname };
    const port = parseInt(process.env.PORT!, 10) || 3000;
    const workerPort = port + 1;
    let tsBuildInfo: string | undefined;
    const tsCache: { [path: string]: string } = Object.create(null);
    const serverCache: Cache = Object.create(null);
    const clientCache: Cache = Object.create(null);
    const assetCache: Cache = Object.create(null);
    const tsBuildInfoPath = ts.sys.resolvePath("tsconfig.tsbuildinfo");
    const cachePath = ts.sys.resolvePath("node_modules/.cache/dev-server.json");
    const tsconfigPath = ts.sys.resolvePath("tsconfig.json");
    const graphqlPath = ts.sys.resolvePath("node_modules/graphql/index.mjs");

    const tsconfig =
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2020",
            module: "ES2020",
            moduleResolution: "Node",
            resolveJsonModule: true,
            jsx: "preserve",
            jsxImportSource: "react",
            importsNotUsedAsValues: "error",
            baseUrl: ".",
            paths: {
              "~/*": ["./*"],
            },
            strict: true,
            esModuleInterop: true,
            noEmitOnError: true,
            importHelpers: true,
            inlineSourceMap: true,
            inlineSources: true,
            skipLibCheck: true,
            forceConsistentCasingInFileNames: true,
          },
          exclude: ["dist"],
        },
        null,
        2,
      ) + "\n";

    ts.sys.writeFile(tsconfigPath, tsconfig);

    try {
      const cache = JSON.parse(ts.sys.readFile(cachePath)!);
      tsBuildInfo = cache.tsBuildInfo;
      Object.assign(tsCache, cache.tsCache);
      Object.assign(assetCache, cache.assetCache);
      Object.assign(serverCache, cache.serverCache);
      Object.assign(clientCache, cache.clientCache);
    } catch {
      ts.sys.deleteFile?.(cachePath);
    }

    const compilerOptions: ts.CompilerOptions = {
      incremental: true,
      tsBuildInfoFile: tsBuildInfoPath,
    };

    const system: ts.System = {
      ...ts.sys,
      readFile(path, encoding) {
        if (path === tsconfigPath) {
          return tsconfig;
        }

        if (path === tsBuildInfoPath) {
          return tsBuildInfo;
        }

        return ts.sys.readFile(path, encoding);
      },
      writeFile(path, data) {
        if (path === tsBuildInfoPath) {
          tsBuildInfo = data;
          return;
        }

        path = path.replace(/\.js(x)?$/, ".ts$1");
        tsCache[path] = data;
        delete serverCache[path];
        delete clientCache[path];
      },
    };

    const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
      getCurrentDirectory: ts.sys.getCurrentDirectory,
      getCanonicalFileName: (fileName) => fileName,
      getNewLine: () => ts.sys.newLine,
    };

    const host = ts.createWatchCompilerHost(
      tsconfigPath,
      compilerOptions,
      system,
      ts.createEmitAndSemanticDiagnosticsBuilderProgram,
      (diagnostic) => ts.sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost)),
      (diagnostic, _newLine, _options, errorCount) => {
        ts.sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost));

        if (errorCount) {
          process.exitCode = 1;
        }
      },
    );

    const watchProgram = ts.createWatchProgram(host);

    const getDataFactory = (target: "server" | "client") => {
      const cache = target === "server" ? serverCache : clientCache;

      return async (url: string | URL): Promise<string | null> => {
        const path = fileURLToPath(url);

        if (path in cache) {
          return cache[path];
        } else if (path in assetCache) {
          return assetCache[path];
        } else if (path in tsCache) {
          try {
            const result = await transformAsync(tsCache[path], {
              filename: path,
              configFile: false,
              babelrc: false,
              sourceMaps: "inline",
              presets: [
                [babelPresetApp, { target, env: "development", inject: options.inject } as babelPresetAppOptions],
              ],
            });

            return (cache[path] = result?.code ?? null);
          } catch {
            return (cache[path] = null);
          }
        }

        const ext = extname(path);

        if (ext === ".js" || ext === ".jsx" || ext === ".mjs") {
          try {
            const data = await readFile(path, "utf8");

            const result = await transformAsync(data, {
              filename: path,
              configFile: false,
              babelrc: false,
              sourceMaps: "inline",
              presets: [
                [babelPresetApp, { target, env: "development", inject: options.inject } as babelPresetAppOptions],
              ],
            });

            return (cache[path] = result?.code ?? null);
          } catch {
            return (cache[path] = null);
          }
        } else if (ext === ".gql" || ext === ".graphql") {
          try {
            let data = await readFile(path, "utf8");

            data = `import { parse } from ${JSON.stringify(graphqlPath)};\nexport default parse(${JSON.stringify(
              data,
            )});`;

            return (assetCache[path] = data);
          } catch {
            return (assetCache[path] = null);
          }
        } else if (ext === ".json") {
          try {
            let data = await readFile(path, "utf8");
            const diagnostics: ts.Diagnostic[] = [];
            const obj = ts.convertToObject(ts.parseJsonText(path, data), diagnostics);

            if (diagnostics.length) {
              data = `throw new SyntaxError(${JSON.stringify(
                ts.formatDiagnosticsWithColorAndContext(diagnostics, formatDiagnosticsHost),
              )});`;
            } else if (obj && typeof obj === "object" && !Array.isArray(obj)) {
              data = `${Object.entries<any>(obj)
                .filter(([key]) => /^[A-Za-z_$][A-Za-z_$0-9]*$/.test(key) && !reserved.check(key, 6, true))
                .map(([key, value]) => `export const ${key} = ${JSON.stringify(value)};\n`)
                .join("")}export default ${JSON.stringify(obj)};`;
            } else {
              data = `export default ${JSON.stringify(obj)};`;
            }

            return (assetCache[path] = data);
          } catch {
            return (assetCache[path] = null);
          }
        } else {
          return null;
        }
      };
    };

    if (serverInput && ts.sys.fileExists(serverInput)) {
      const getServerData = getDataFactory("server");
      const url = new URL(`data:text/javascript,import ${JSON.stringify(pathToFileURL(serverInput))};`);

      const worker = new Worker(url, {
        execArgv: ["--experimental-loader", import.meta.url],
        env: { NODE_ENV: "development", PORT: workerPort.toFixed() },
      });

      worker.on("message", async (url: string) => {
        const data = await getServerData(url);
        worker.postMessage([url, data]);
      });
    }

    const getClientData = getDataFactory("client");
    const proxy = httpProxy.createProxyServer({ target: `http://localhost:${workerPort}` });

    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url || "/", "file:///");
        const pathname = url.pathname;

        if (pathname === "/client/index.js") {
          res.writeHead(302, redirectHeaders).end();
          return;
        }

        const data = await getClientData(url);

        if (data !== null) {
          res.setHeader("content-type", "application/javascript; charset=utf-8");
          res.end(data);
          return;
        }

        await new Promise<void>((resolve, reject) => {
          proxy.web(req, res, undefined, (err) => {
            if (err) {
              reject();
            } else {
              resolve();
            }
          });
        });
      } catch {
        if (!res.headersSent) {
          res.writeHead(500);
        }

        if (!res.writableEnded) {
          res.end();
        }
      }
    });

    server.listen(port);

    process.on("exit", () => {
      try {
        watchProgram.close();
        ts.sys.writeFile(cachePath, JSON.stringify({ tsBuildInfo, tsCache, serverCache, clientCache, assetCache }));
      } catch {}
    });

    process.on("SIGINT", () => {
      server.close((err) => {
        if (err) {
          console.error(String(err));
          process.exit(1);
        } else {
          process.exit(0);
        }
      });

      setTimeout(() => server.emit("close"));
    });
  };
} else {
  let i = 0;
  const messages: { [url: string]: (data: string) => void } = Object.create(null);

  parentPort!.on("message", ([url, data]: [string, string]) => {
    messages[url](data);
    delete messages[url];
  });

  const getFileSource = (url: string) =>
    new Promise<string>((resolve) => {
      url = new URL(`?${i++}`, url).href;
      messages[url] = resolve;
      parentPort!.postMessage(url);
    });

  resolve = async (specifier, context, defaultResolve) => {
    const parentURL = context.parentURL;

    if (specifier.startsWith("http://") || specifier.startsWith("https://")) {
      return {
        url: specifier,
      };
    } else if (parentURL && (parentURL.startsWith("http://") || parentURL.startsWith("https://"))) {
      return {
        url: new URL(specifier, parentURL).href,
      };
    }

    return defaultResolve(specifier, context, defaultResolve);
  };

  getFormat = async (url, context, defaultGetFormat) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return { format: "module" };
    }

    if (url.startsWith("file:///") && !url.includes("/node_modules/")) {
      return { format: "module" };
    }

    return defaultGetFormat(url, context, defaultGetFormat);
  };

  getSource = async (url, context, defaultGetSource) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      const res = await fetch(url);
      const text = await res.text();
      return { source: text };
    }

    if (url.startsWith("file:///") && !url.includes("/node_modules/")) {
      return { source: await getFileSource(url) };
    }

    return defaultGetSource(url, context, defaultGetSource);
  };
}

export { _default as default, resolve, getFormat, getSource };
