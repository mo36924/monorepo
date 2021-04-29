import { parentPort } from "worker_threads";
import { pathnames } from "./refresh";

let i = 0;

parentPort?.on("message", (url: any) => {
  if (typeof url !== "string") {
    return;
  }

  const _url = new URL(`?${i++}`, url);

  if (pathnames.has(_url.pathname)) {
    import(_url.href);
  }
});
