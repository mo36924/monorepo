import { access, readFile, unlink, writeFile } from "fs/promises";
import { createServer } from "http";
import { extname, resolve } from "path";
import { env } from "process";
import { fileURLToPath, pathToFileURL } from "url";
import { Worker } from "worker_threads";
import { transformAsync } from "@babel/core";
import type { Options as InjectOptions } from "@mo36924/babel-plugin-inject";
import babelPresetApp, { Options as babelPresetAppOptions } from "@mo36924/babel-preset-app";
import { parse } from "graphql";
import httpProxy from "http-proxy";
import reserved from "reserved-words";
import ts from "typescript";

export type Options = {
  inject?: InjectOptions;
};

type Cache = { [path: string]: string | null };

const tsconfig = `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "jsx": "preserve",
    "jsxImportSource": "react",
    "importsNotUsedAsValues": "error",
    "baseUrl": ".",
    "paths": {
      "~/*": ["./*"]
    },
    "strict": true,
    "esModuleInterop": true,
    "noEmitOnError": true,
    "importHelpers": true,
    "inlineSourceMap": true,
    "inlineSources": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "exclude": ["dist"]
}
`;

const tsconfigPath = resolve("tsconfig.json");
const tsBuildInfoPath = resolve("tsconfig.tsbuildinfo");
const cachePath = resolve("node_modules/.cache/dev-server.json");
const port = parseInt(env.PORT!, 10) || 3000;
const workerPort = (port + 1).toFixed();

export default async (options: Options = {}) => {
  const [serverTs, serverTsx, clientTs, clientTsx, cache] = await Promise.allSettled([
    access("server/index.ts"),
    access("server/index.tsx"),
    access("client/index.ts"),
    access("client/index.tsx"),
    readFile(cachePath, "utf8"),
    writeFile(tsconfigPath, tsconfig),
  ]);

  const serverInput = serverTs.status === "fulfilled" ? "server/index.ts" : "server/index.tsx";
  const clientInput = clientTs.status === "fulfilled" ? "client/index.ts" : "client/index.tsx";

  let tsBuildInfo: string | undefined;
  const tsCache: { [path: string]: string } = Object.create(null);
  const serverCache: Cache = Object.create(null);
  const clientCache: Cache = Object.create(null);
  const assetCache: Cache = Object.create(null);

  let deleteCache = true;

  if (cache.status === "fulfilled") {
    try {
      const _cache = JSON.parse(cache.value);
      tsBuildInfo = _cache.tsBuildInfo;
      Object.assign(tsCache, _cache.tsCache);
      Object.assign(assetCache, _cache.assetCache);
      Object.assign(serverCache, _cache.serverCache);
      Object.assign(clientCache, _cache.clientCache);
      deleteCache = false;
    } catch {}
  }

  if (deleteCache) {
    try {
      await unlink(cachePath);
    } catch {}
  }

  const formatDiagnosticsHost: ts.FormatDiagnosticsHost = {
    getCurrentDirectory: ts.sys.getCurrentDirectory,
    getCanonicalFileName: (fileName) => fileName,
    getNewLine: () => ts.sys.newLine,
  };

  const host = ts.createWatchCompilerHost(
    tsconfigPath,
    { incremental: true, tsBuildInfoFile: tsBuildInfoPath },
    {
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
    },
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    (diagnostic) => ts.sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost)),
    (diagnostic, _newLine, _options, errorCount) => {
      ts.sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost));
      process.exitCode = errorCount || 1;
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

          const code = result?.code ?? "";
          cache[path] = code;
          return code;
        } catch {
          return cache[path] ?? "";
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

          const code = result?.code ?? "";
          cache[path] = code;
          return code;
        } catch {
          return cache[path] ?? "";
        }
      } else if (ext === ".gql" || ext === ".graphql") {
        try {
          const data = await readFile(path, "utf8");
          const documentNode = parse(data, { noLocation: true });
          const documentNodeJson = JSON.stringify(documentNode);

          const documentNodeString = documentNodeJson.includes("'")
            ? JSON.stringify(documentNodeJson)
            : `'${documentNodeJson}'`;

          const code = `export default JSON.parse(${documentNodeString});`;
          assetCache[path] = code;
          return code;
        } catch {
          return assetCache[path] ?? "";
        }
      } else if (ext === ".json") {
        try {
          const data = await readFile(path, "utf8");
          const diagnostics: ts.Diagnostic[] = [];
          const obj = ts.convertToObject(ts.parseJsonText(path, data), diagnostics);
          let code: string;

          if (diagnostics.length) {
            code = `throw new SyntaxError(${JSON.stringify(
              ts.formatDiagnosticsWithColorAndContext(diagnostics, formatDiagnosticsHost),
            )});`;
          } else if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            code = `${Object.entries<any>(obj)
              .filter(([key]) => /^[A-Za-z_$][A-Za-z_$0-9]*$/.test(key) && !reserved.check(key, 6, true))
              .map(([key, value]) => `export const ${key} = ${JSON.stringify(value)};\n`)
              .join("")}export default ${JSON.stringify(obj)};`;
          } else {
            code = `export default ${JSON.stringify(obj)};`;
          }

          assetCache[path] = code;
          return code;
        } catch {
          return assetCache[path] ?? "";
        }
      } else {
        return null;
      }
    };
  };

  if (serverInput && ts.sys.fileExists(serverInput)) {
    const url = new URL(`data:text/javascript,import ${JSON.stringify(pathToFileURL(serverInput))};`);
    const getServerData = getDataFactory("server");

    const worker = new Worker(url, {
      execArgv: ["--experimental-loader", new URL("index.js", import.meta.url).href],
      env: { NODE_ENV: "development", PORT: workerPort },
    });

    worker.on("message", async (url: string) => {
      const data = await getServerData(url);
      worker.postMessage([url, data]);
    });
  }

  const getClientData = getDataFactory("client");
  const proxy = httpProxy.createProxyServer({ target: `http://localhost:${workerPort}` });
  const redirectHeaders = { location: pathToFileURL(clientInput).pathname };

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "file:///");
      const pathname = url.pathname;

      if (pathname === "/index.js") {
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
