import { createServer as createHttpServer, Server as HttpServer, ServerOptions } from "http";
import { types } from "util";
import cacheMiddleware from "@mo36924/cache-middleware";
import graphqlMiddleware from "@mo36924/graphql-middleware";
import httpError, { HttpError } from "http-errors";
import { Request } from "./request";
import { Response } from "./response";

type PromiseOrValue<T> = Promise<T> | T;

export type MiddlewareFactory = (server: Server) => PromiseOrValue<void | Middleware>;
export type Middleware = (request: Request, response: Response) => PromiseOrValue<void | null | undefined | boolean>;
export type ErrorMiddlewareFactory = (server: Server) => PromiseOrValue<void | ErrorMiddleware>;
export type ErrorMiddleware = (
  error: HttpError,
  request: Request,
  response: Response,
) => PromiseOrValue<void | null | undefined | boolean>;
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
  middlewareFactories: MiddlewareFactory[] = [cacheMiddleware(), graphqlMiddleware()];
  middlewares: Middleware[] = [];
  errorMiddlewareFactories: ErrorMiddlewareFactory[] = [];
  errorMiddlewares: ErrorMiddleware[] = [];
  use = (...middlewareFactories: MiddlewareFactory[]) => {
    this.middlewareFactories.push(...middlewareFactories);
  };
  error = (...errorMiddlewareFactories: ErrorMiddlewareFactory[]) => {
    this.errorMiddlewareFactories.push(...errorMiddlewareFactories);
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

          if (result || response.writableEnded) {
            return;
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.log(err);
        }

        const _httpError = httpError.isHttpError(err) ? err : httpError(500, err instanceof Error ? err : String(err));

        if (!response.headersSent) {
          response.statusCode = _httpError.statusCode;

          if (_httpError.headers) {
            for (const [name, value] of Object.keys(_httpError.headers)) {
              response.setHeader(name, value);
            }
          }
        }

        try {
          for (const errorMiddleware of errorMiddlewares) {
            let result = errorMiddleware(_httpError, request as Request, response as Response);

            if (types.isPromise(result)) {
              result = await result;
            }

            if (result) {
              return;
            }
          }
        } catch {}

        if (!response.writableEnded) {
          response.end(_httpError.message);
        }

        return;
      }

      if (!response.headersSent) {
        response.writeHead(404);
      }

      if (!response.writableEnded) {
        response.end();
      }
    });

    this.server = server;

    const [_middlewares, _errorMiddlewares] = await Promise.all([
      Promise.all(this.middlewareFactories.map((middlewareFactory) => middlewareFactory(this))),
      Promise.all(this.errorMiddlewareFactories.map((errorMiddlewareFactory) => errorMiddlewareFactory(this))),
    ]);

    const middlewares = _middlewares.filter((middleware): middleware is Middleware => !!middleware);
    const errorMiddlewares = _errorMiddlewares.filter((middleware): middleware is ErrorMiddleware => !!middleware);

    this.middlewares = middlewares;
    this.errorMiddlewares = errorMiddlewares;

    await new Promise<void>((resolve) => {
      server.listen(port, resolve);
    });
  };
  close = async () => {
    await new Promise<void>((resolve, reject) => {
      const server = this.server;

      if (!server) {
        resolve();
      }

      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });

      setImmediate(() => server.emit("close"));
    });
  };
}

export function createServer(options?: Options) {
  const server = new Server(options);
  return server;
}
