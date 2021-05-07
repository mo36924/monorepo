import type { MiddlewareFactory } from "@mo36924/http-server";
import httpProxy, { ServerOptions } from "http-proxy";

export default (options: ServerOptions = {}): MiddlewareFactory => () => {
  const proxy = httpProxy.createProxyServer(options);
  return (req, res) =>
    new Promise<void>((resolve, reject) => {
      proxy.web(req, res, undefined, (err) => {
        if (err) {
          reject();
        } else {
          resolve();
        }
      });
    });
};
