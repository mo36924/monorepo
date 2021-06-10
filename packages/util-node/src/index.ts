import { exec as _exec } from "child_process";
import { AddressInfo, createServer } from "net";
import { promisify } from "util";

export const exec = promisify(_exec);

export const emptyPort = (port = 0) =>
  new Promise<number>((resolve, reject) => {
    const server = createServer()
      .once("error", (err) => {
        reject(err);
      })
      .listen(port, () => {
        const port = (server.address() as AddressInfo).port;

        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve(port);
          }
        });
      });
  });
