import { createServer } from "http";
import { env } from "process";
import { fileURLToPath, pathToFileURL } from "url";
import { Worker } from "worker_threads";
import type { Config } from "@mo36924/config";
import { bold, green } from "colorette";
import httpProxy from "http-proxy";
import ts from "typescript";
import { memoize } from "../util";
import cache from "./cache";
import graphql from "./graphql";
import client from "./javascript-client";
import server from "./javascript-server";
import json from "./json";
import typescript from "./typescript";

export default async (config: Config) => {
  const serverInput = config.server;
  const port = parseInt(env.PORT!, 10) || 3000;
  const workerPort = (port + 1).toFixed();

  const [
    graphqlTransformer,
    javascriptServerTransformer,
    javascriptClientTransformer,
    jsonTransformer,
  ] = await Promise.all([graphql(), server(config), client(config), json(), typescript()]);

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
    const loader = await import("./loader");

    const worker = new Worker(url, {
      execArgv: ["--experimental-loader", new URL(loader.url).href],
      env: { NODE_ENV: "development", PORT: workerPort },
    });

    worker.on("message", async (url: string) => {
      const data = (await serverTransformer(url)) ?? "";
      worker.postMessage([url, data]);
    });
  }

  const proxy = httpProxy.createProxyServer({ target: `http://localhost:${workerPort}` });

  const httpServer = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", "file:///");
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
  console.log(green(`Server running at ${bold(`http://localhost:${port}`)}`));

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
