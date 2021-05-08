import type { MiddlewareFactory } from "@mo36924/http-server";

export default (): MiddlewareFactory => () => (req, res) => {
  if (req.$url.searchParams.has("pathname")) {
    res.end(`export default ${JSON.stringify(req.pathname)};`);
    return true;
  }
};
