import { createServer } from "http";
import { env } from "process";
import { fileURLToPath, pathToFileURL } from "url";
import { Worker } from "worker_threads";
import httpProxy from "http-proxy";
import ts from "typescript";
import graphql from "./graphql";
import client from "./javascript-client";
import server from "./javascript-server";
import json from "./json";
import type { Options } from "./type";
import typescript from "./typescript";

export default async (options: Options) => {
  const serverInput = "lib/index.ts";
  const clientInput = "lib/index.client.ts";
  const port = parseInt(env.PORT!, 10) || 3000;
  const workerPort = (port + 1).toFixed();

  const [_graphql, _server, _client, _json] = await Promise.all([
    graphql(),
    server(options),
    client(options),
    json(),
    typescript(),
  ]);

  const servers = [_graphql, _server, _json];
  const clients = [_graphql, _client, _json];

  const getServerData = async (url: string | URL) => {
    try {
      const path = fileURLToPath(url);

      for (const server of servers) {
        const data = await server(path);

        if (data !== undefined) {
          return data;
        }
      }
    } catch {}

    return "";
  };

  const getClientData = async (url: string | URL) => {
    try {
      const path = fileURLToPath(url);

      for (const client of clients) {
        const data = await client(path);

        if (data !== undefined) {
          return data;
        }
      }
    } catch {}

    return "";
  };

  if (ts.sys.fileExists(serverInput)) {
    const url = new URL(`data:text/javascript,import ${JSON.stringify(pathToFileURL(serverInput))};`);

    const worker = new Worker(url, {
      execArgv: ["--experimental-loader", new URL("index.js", import.meta.url).href],
      env: { NODE_ENV: "development", PORT: workerPort },
    });

    worker.on("message", async (url: string) => {
      const data = await getServerData(url);
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

      const data = await getClientData(url);

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
