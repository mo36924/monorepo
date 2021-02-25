import { createServer, IncomingMessage, ServerResponse } from "http";
import httpError from "http-errors";

type PromiseOrValue<T> = Promise<T> | T;
type Middleware = (req: IncomingMessage, res: ServerResponse) => Promise<any>;

export type Options = { port?: number; middlewares: PromiseOrValue<Middleware>[] };

export default async (options: Options) => {
  const port = options.port ?? process.env.PORT ?? 8080;
  const middlewares = await Promise.all(options.middlewares);

  const server = createServer(async (req, res) => {
    try {
      for (const middleware of middlewares) {
        const result = await middleware(req, res);

        if (result) {
          return;
        }
      }
    } catch (rawError) {
      const error = httpError(500, rawError instanceof Error ? rawError : String(rawError));

      if (!res.headersSent) {
        res.writeHead(error.statusCode, error.message, error.headers);
      }

      if (!res.writableEnded) {
        res.end(error.message);
      }
    }
  });

  server.listen(port);
  return server;
};
