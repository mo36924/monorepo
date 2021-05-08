import { pathToFileURL } from "url";
import type { MiddlewareFactory } from "@mo36924/http-server";
import watcher from "./watcher";

export default (): MiddlewareFactory => () => (req, res) => {
  if (req.url === "/sse") {
    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    });

    res.write("\n");

    watcher.onchange((absolutePath) => {
      res.write(`data: ${pathToFileURL(absolutePath).href}\n\n`);
    });

    return true;
  }
};
