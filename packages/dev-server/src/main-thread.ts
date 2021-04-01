import { createServer } from "http";
import { env } from "process";
import { fileURLToPath, pathToFileURL } from "url";
import { Worker } from "worker_threads";
import httpProxy from "http-proxy";
import ts from "typescript";
import cache from "./cache";
import graphql from "./graphql";
import client from "./javascript-client";
import server from "./javascript-server";
import json from "./json";
import type { Options } from "./type";
import typescript from "./typescript";
import { memoize } from "./util";

export default async (options: Options) => {
  const serverInput = "lib/index.ts";
  const clientInput = "lib/index.client.ts";
  const port = parseInt(env.PORT!, 10) || 3000;
  const workerPort = (port + 1).toFixed();

  const [
    graphqlTransformer,
    javascriptServerTransformer,
    javascriptClientTransformer,
    jsonTransformer,
  ] = await Promise.all([graphql(), server(options), client(options), json(), typescript()]);

  const graphqlTransformerWithCache = memoize(graphqlTransformer, cache.graphql);
  const javascriptServerTransformerWithCache = memoize(javascriptServerTransformer, cache.server);
  const javascriptClientTransformerWithCache = memoize(javascriptClientTransformer, cache.client);
  const jsonTransformerWithCache = memoize(jsonTransformer, cache.json);

  const serverTransformers = [
    graphqlTransformerWithCache,
    javascriptServerTransformerWithCache,
    jsonTransformerWithCache,
  ];

  const clientTransformers = [
    graphqlTransformerWithCache,
    javascriptClientTransformerWithCache,
    jsonTransformerWithCache,
  ];

  const serverTransformer = async (url: string | URL) => {
    try {
      const path = fileURLToPath(url);

      for (const transformer of serverTransformers) {
        const data = await transformer(path);

        if (data !== undefined) {
          return data;
        }
      }
    } catch {}
  };

  const clientTransformer = async (url: string | URL) => {
    try {
      const path = fileURLToPath(url);

      for (const transformer of clientTransformers) {
        const data = await transformer(path);

        if (data !== undefined) {
          return data;
        }
      }
    } catch {}
  };

  if (ts.sys.fileExists(serverInput)) {
    const url = new URL(`data:text/javascript,import ${JSON.stringify(pathToFileURL(serverInput))};`);

    const worker = new Worker(url, {
      execArgv: ["--experimental-loader", new URL("index.js", import.meta.url).href],
      env: { NODE_ENV: "development", PORT: workerPort },
    });

    worker.on("message", async (url: string) => {
      const data = (await serverTransformer(url)) ?? "";
      worker.postMessage([url, data]);
    });
  }

  const proxy = httpProxy.createProxyServer({ target: `http://localhost:${workerPort}` });
  const redirectHeaders = { location: pathToFileURL(clientInput).pathname };

  const httpServer = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "file:///");
      const pathname = url.pathname;

      if (pathname === "/index.js") {
        res.writeHead(302, redirectHeaders).end();
        return;
      }

      const data = await clientTransformer(url);

      if (data !== undefined) {
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

  httpServer.listen(port);

  process.on("SIGINT", () => {
    httpServer.close((err) => {
      if (err) {
        console.error(String(err));
        process.exit(1);
      } else {
        process.exit(0);
      }
    });

    setImmediate(() => httpServer.emit("close"));
  });
};
