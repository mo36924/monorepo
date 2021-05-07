import { createServer as _createServer, IncomingMessage, ServerResponse } from "http";
import { types } from "util";

export type Middleware = () => void;
export type Context = { request: IncomingMessage; response: ServerResponse };

const { isPromise } = types;
let _context: Context;

export const context = () => _context;

export default () => {
  const _middlewares: Middleware[] = [];

  const run = (index: number, context: Context) => {
    const middleware = _middlewares[index];

    if (middleware === undefined) {
      return;
    }

    _context = context;

    try {
      middleware();
    } catch (err) {
      if (isPromise(err)) {
        err.then(() => {
          run(index, context);
        });

        return;
      }

      return;
    }

    run(index + 1, context);
  };

  const server = _createServer((request, response) => {
    run(0, { request, response });
  });

  return {
    server,
    use(...middlewares: Middleware[]) {
      _middlewares.push(...middlewares);
    },
    async listen(port?: number, hostname?: string) {
      await new Promise<void>((resolve) => {
        server.listen(port, hostname, resolve);
      });
    },
    async close() {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });

        setImmediate(() => server.emit("close"));
      });
    },
  };
};
