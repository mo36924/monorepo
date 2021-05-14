import { unwatchFile, watchFile } from "fs";
import { pathToFileURL } from "url";
import { Worker } from "worker_threads";
import type { Config } from "@mo36924/config";
import proxy from "@mo36924/http-proxy";
import { createServer } from "@mo36924/http-server";
import { bold, green, red } from "colorette";
import createCache from "./cache";
import css from "./css";
import graphql from "./graphql";
import javascript from "./javascript";
import json from "./json";
import sse from "./sse";

export default async ({ server, inject, port, devServerPort }: Config) => {
  const cache = await createCache();
  const httpServer = createServer();

  httpServer.use(
    sse(),
    css({ cache }),
    graphql({ cache }),
    json({ cache }),
    javascript({ cache, inject }),
    proxy({ target: `http://127.0.0.1:${port}` }),
  );

  await httpServer.listen(devServerPort);
  const devServerUrl = `http://127.0.0.1:${devServerPort}`;
  console.log(green(`Server running at ${bold(devServerUrl)}`));
  const { filename } = await import("./loader");

  const exec = () => {
    const url = new URL(`data:text/javascript,import(${JSON.stringify(pathToFileURL(server))});`);

    const worker = new Worker(url, {
      execArgv: ["--experimental-loader", filename],
      env: { ...process.env, PORT: `${port}` },
      workerData: { devServerUrl },
    });

    worker.on("error", (err) => {
      console.error(err);
    });

    worker.on("exit", () => {
      watchFile(server, (stats) => {
        if (stats.isFile()) {
          unwatchFile(server);
          exec();
        }
      });
    });
  };

  exec();

  process.on("SIGINT", async () => {
    try {
      await httpServer.close();
      process.exit(0);
    } catch (err) {
      console.error(red(String(err)));
      process.exit(1);
    }
  });
};
