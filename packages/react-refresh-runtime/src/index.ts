import { parentPort } from "worker_threads";
import { components } from "./components";

let i = 0;

parentPort?.on("message", (url: any) => {
  if (typeof url !== "string") {
    return;
  }

  const _url = new URL(`?${i++}`, url);

  if (components.has(_url.pathname)) {
    import(_url.href);
  }
});

export { components };
