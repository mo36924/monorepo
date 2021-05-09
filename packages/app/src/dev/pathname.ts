import type { MiddlewareFactory } from "@mo36924/http-server";

export default (): MiddlewareFactory => () => async (req, res) => {
  if (req.$url.searchParams.has("pathname")) {
    await res.type("js").send(`export default ${JSON.stringify(req.pathname)};`);
  }
};
