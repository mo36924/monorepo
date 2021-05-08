import { pathToFileURL } from "url";
import { Worker } from "worker_threads";
import type { Config } from "@mo36924/config";
import proxy from "@mo36924/http-proxy";
import { createServer } from "@mo36924/http-server";
import { bold, green, red } from "colorette";
import ts from "typescript";
import createCache from "./cache";
import css from "./css";
import graphql from "./graphql";
import javascript from "./javascript";
import json from "./json";
import pathname from "./pathname";
import sse from "./sse";

export default async ({ server, clientInject, serverInject, port, devServerPort }: Config) => {
  const cache = await createCache();
  const httpServer = createServer();

  httpServer.use(
    sse(),
    pathname(),
    css({ cache }),
    graphql({ cache }),
    json({ cache }),
    javascript({ cache, clientInject, serverInject }),
    proxy({ target: `http://localhost:${port}}` }),
  );

  await httpServer.listen(devServerPort);
  const devServerUrl = `http://127.0.0.1:${devServerPort}`;
  console.log(green(`Server running at ${bold(devServerUrl)}`));

  if (ts.sys.fileExists(server)) {
    const url = new URL(`data:text/javascript,import ${JSON.stringify(pathToFileURL(server))};`);
    const loader = await import("./loader");

    new Worker(url, {
      execArgv: ["--experimental-loader", new URL(loader.url).href],
      env: { ...process.env, PORT: `${port}` },
      workerData: { devServerUrl },
    });
  }

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
