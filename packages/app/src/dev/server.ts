import { FSWatcher, watch } from "fs";
import { readFile } from "fs/promises";
import { createServer } from "http";
import { extname, resolve } from "path";
import { env } from "process";
import { fileURLToPath, pathToFileURL } from "url";
import { Worker } from "worker_threads";
import type { Config } from "@mo36924/config";
import { bold, green, red } from "colorette";
import httpProxy from "http-proxy";
import ts from "typescript";
import { formatDiagnosticsHost } from "../util";
import css from "./css";
import graphql from "./graphql";
import client from "./javascript-client";
import server from "./javascript-server";
import json from "./json";

const contentType = (path: string) => {
  switch (extname(path)) {
    case ".ts":
    case ".tsx":
    case ".js":
    case ".jsx":
    case ".mjs":
    case ".cjs":
    case ".gql":
    case ".graphql":
      return "application/javascript; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    default:
      return "text/plain; charset=utf-8";
  }
};

export default async (config: Config) => {
  const serverInput = config.server;
  const port = parseInt(env.PORT!, 10) || 3000;
  const workerPort = (port + 1).toFixed();

  const [
    cssTransformer,
    graphqlTransformer,
    javascriptServerTransformer,
    javascriptClientTransformer,
    jsonTransformer,
  ] = await Promise.all([css(), graphql(), server(config), client(config), json()]);

  const serverTransformers = [graphqlTransformer, javascriptServerTransformer, jsonTransformer];
  const clientTransformers = [cssTransformer, graphqlTransformer, javascriptClientTransformer, jsonTransformer];
  const cachePath = resolve("node_modules/.cache/dev-server.json");
  const serverCache: { [path: string]: string } = Object.create(null);
  const clientCache: { [path: string]: string } = Object.create(null);
  const typescriptCache: { [path: string]: string } = Object.create(null);
  const watches = new Map<string, FSWatcher>();
  const tsconfigPath = resolve("tsconfig.json");
  const tsBuildInfoPath = resolve("tsconfig.tsbuildinfo");
  let tsBuildInfo: string | undefined;

  const watcher = (path: string) => {
    if (!watches.has(path)) {
      try {
        const watcher = watch(path, () => {
          delete serverCache[path];
          delete clientCache[path];
        });

        watches.set(path, watcher);
      } catch {}
    }
  };

  try {
    const data = await readFile(cachePath, "utf8");
    const cache = JSON.parse(data);
    Object.assign(serverCache, cache?.serverCache);
    Object.assign(clientCache, cache?.clientCache);
    tsBuildInfo = cache?.tsBuildInfo;
  } catch {}

  const host = ts.createWatchCompilerHost(
    tsconfigPath,
    { incremental: true, tsBuildInfoFile: tsBuildInfoPath, sourceMap: false, inlineSourceMap: true },
    {
      ...ts.sys,
      readFile(path, encoding) {
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
        delete serverCache[path];
        delete clientCache[path];
        typescriptCache[path] = data;
      },
    },
    ts.createEmitAndSemanticDiagnosticsBuilderProgram,
    (diagnostic) => ts.sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost)),
    (diagnostic, _newLine, _options, errorCount) => {
      ts.sys.write(ts.formatDiagnosticsWithColorAndContext([diagnostic], formatDiagnosticsHost));
      process.exitCode = errorCount || 1;
    },
  );

  const program = ts.createWatchProgram(host);

  if (ts.sys.fileExists(serverInput)) {
    const url = new URL(`data:text/javascript,import ${JSON.stringify(pathToFileURL(serverInput))};`);
    const loader = await import("./loader");

    const worker = new Worker(url, {
      execArgv: ["--experimental-loader", new URL(loader.url).href],
      env: { NODE_ENV: "development", PORT: workerPort },
    });

    worker.on("message", async (url: string) => {
      const path = fileURLToPath(url);

      if (path in serverCache) {
        watcher(path);
        worker.postMessage([url, serverCache[path]]);
        return;
      }

      try {
        const data = typescriptCache[path] ?? (await readFile(path, "utf8"));

        for (const transformer of serverTransformers) {
          const _data = await transformer(path, data);

          if (_data != null) {
            serverCache[path] = _data;
            watcher(path);
            worker.postMessage([url, _data]);
            return;
          }
        }
      } catch {}

      worker.postMessage([url, ""]);
      return;
    });
  }

  const proxy = httpProxy.createProxyServer({ target: `http://localhost:${workerPort}` });

  const httpServer = createServer(async (req, res) => {
    const url = `file://${req.url || "/"}`;
    const path = fileURLToPath(url);

    if (path in clientCache) {
      watcher(path);
      res.setHeader("content-type", contentType(path));
      res.end(clientCache[path]);
      return;
    }

    try {
      const data = typescriptCache[path] ?? (await readFile(path, "utf8"));

      for (const transformer of clientTransformers) {
        const _data = await transformer(path, data);

        if (_data != null) {
          clientCache[path] = _data;
          watcher(path);
          res.setHeader("content-type", contentType(path));
          res.end(_data);
          return;
        }
      }
    } catch {}

    try {
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

  httpServer.listen(port);
  console.log(green(`Server running at ${bold(`http://localhost:${port}`)}`));

  process.on("SIGINT", () => {
    httpServer.close((err) => {
      if (err) {
        console.error(red(String(err)));
        process.exit(1);
      } else {
        process.exit(0);
      }
    });

    setImmediate(() => httpServer.emit("close"));
  });

  process.on("exit", () => {
    try {
      ts.sys.writeFile(
        cachePath,
        JSON.stringify({
          serverCache: serverCache,
          clientCache: clientCache,
          typescriptCache: typescriptCache,
          tsBuildInfo: tsBuildInfo,
        }),
      );

      program.close();
    } catch {}
  });
};
