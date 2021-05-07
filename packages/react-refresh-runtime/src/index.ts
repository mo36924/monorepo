import { on } from "events";
import { get } from "http";
import { createInterface } from "readline";
import { workerData } from "worker_threads";
import { components } from "./components";
import "./refresh";

if (workerData?.devServerUrl) {
  let i = 0;

  get(`${workerData.devServerUrl}/sse`, async (res) => {
    for await (const [line] of on(createInterface(res), "line") as AsyncIterableIterator<string>) {
      if (!line.startsWith("data: ")) {
        continue;
      }

      const url = new URL(`?${i++}`, line.slice(6));

      if (components.has(url.pathname)) {
        import(url.href).catch(() => {});
      }
    }
  });
}

export { components };
