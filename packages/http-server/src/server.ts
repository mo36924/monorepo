import { createServer as createHttpServer, Server as HttpServer, ServerOptions } from "http";
import { types } from "util";
import httpError from "http-errors";
import { Request } from "./request";
import { Response } from "./response";

type PromiseOrValue<T> = Promise<T> | T;

export type MiddlewareFactory = (server: Server) => PromiseOrValue<void | Middleware>;
export type Middleware = (request: Request, response: Response) => PromiseOrValue<void | true>;
export type Options = {
  Request?: typeof Request;
  Response?: typeof Response;
} & Pick<ServerOptions, "insecureHTTPParser" | "maxHeaderSize">;
export class Server {
  constructor(options: Options = {}) {
    const { Request: _Request = Request, Response: _Response = Response, ..._options } = options;
    this.options = options;

    this.serverOptions = {
      ..._options,
      IncomingMessage: _Request,
      ServerResponse: _Response,
    };

    this.Request = _Request;
    this.Response = _Response;
  }
  options: Options;
  serverOptions: ServerOptions;
  Request: typeof Request;
  Response: typeof Response;
  server!: HttpServer;
  middlewareFactories: MiddlewareFactory[] = [];
  middlewares: Middleware[] = [];
  use = (middlewareFactory: MiddlewareFactory) => {
    this.middlewareFactories.push(middlewareFactory);
  };
  listen = async (port = parseInt(process.env.PORT as any, 10) || 8080) => {
    const server = createHttpServer(this.serverOptions, async (request, response) => {
      (request as Request).response = response as Response;
      (response as Response).request = request as Request;

      try {
        for (const middleware of middlewares) {
          let result = middleware(request as Request, response as Response);

          if (types.isPromise(result)) {
            result = await result;
          }

          if (result) {
            return;
          }
        }
      } catch (err) {
        const _httpError = httpError.isHttpError(err) ? err : httpError(500, err instanceof Error ? err : String(err));

        if (!response.headersSent) {
          response.writeHead(_httpError.statusCode, _httpError.headers);
        }

        if (!response.writableEnded) {
          response.end(_httpError.message);
        }
      }
    });

    this.server = server;

    const _middlewares = await Promise.all(
      this.middlewareFactories.map((middlewareFactory) => middlewareFactory(this)),
    );

    const middlewares = _middlewares.filter((middleware): middleware is Middleware => !!middleware);
    this.middlewares = middlewares;

    await new Promise<void>((resolve) => {
      server.listen(port, resolve);
    });
  };
  close = async () => {
    await new Promise<void>((resolve, reject) => {
      if (!this.server) {
        resolve();
      }

      this.server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  };
}

export function createServer(options?: Options) {
  const server = new Server(options);
  return server;
}
