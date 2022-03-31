import { resolve } from "path";
import { fileURLToPath } from "url";
import { Worker } from "worker_threads";

export default (path: string, argv: string[]) => {
  const worker = new Worker(resolve(path), {
    argv,
    execArgv: [
      "--no-warnings",
      "--enable-source-maps",
      "--experimental-specifier-resolution=node",
      "--experimental-loader",
      fileURLToPath(new URL("loader.js", import.meta.url)),
    ],
  });

  worker.on("error", console.error);
};
