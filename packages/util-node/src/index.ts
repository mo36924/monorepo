import { exec as _exec } from "child_process";
import { writeFile as _writeFile } from "fs/promises";
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

export const writeFile = async (path: string, code: string, options?: { overwrite?: boolean }) => {
  const { default: prettier } = await import("prettier");
  const config = await prettier.resolveConfig(path);

  await _writeFile(path, prettier.format(code, { ...config, filepath: path }), {
    flag: options?.overwrite === false ? "wx" : undefined,
  });
};
