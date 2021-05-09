import { unwatchFile, watchFile } from "fs";
import { pathToFileURL } from "url";
import { Worker } from "worker_threads";
import type { Config } from "@mo36924/config";
import proxy from "@mo36924/http-proxy";
import { createServer } from "@mo36924/http-server";
import redirect from "@mo36924/redirect-middleware";
import { bold, green, red } from "colorette";
import createCache from "./cache";
import css from "./css";
import graphql from "./graphql";
import javascript from "./javascript";
import json from "./json";
import pathname from "./pathname";
import sse from "./sse";

export default async ({ main, clientInject, serverInject, port, devServerPort }: Config) => {
  const cache = await createCache();
  const httpServer = createServer();

  httpServer.use(
    sse(),
    pathname(),
    redirect({ "/": pathToFileURL(main).pathname }),
    css({ cache }),
    graphql({ cache }),
    json({ cache }),
    javascript({ cache, clientInject, serverInject }),
    proxy({ target: `http://127.0.0.1:${port}}` }),
  );

  await httpServer.listen(devServerPort);
  const devServerUrl = `http://127.0.0.1:${devServerPort}`;
  console.log(green(`Server running at ${bold(devServerUrl)}`));
  const { filename } = await import("./loader");

  const exec = () => {
    const worker = new Worker(main, {
      execArgv: ["--experimental-loader", filename],
      env: { ...process.env, PORT: `${port}` },
      workerData: { devServerUrl },
    });

    worker.on("error", (err) => {
      console.error(err);
    });

    worker.on("exit", () => {
      watchFile(main, (stats) => {
        if (stats.isFile()) {
          unwatchFile(main);
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
