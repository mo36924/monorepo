import { exec as _exec } from "child_process";
import { writeFile as _writeFile, readFile as _readFile } from "fs/promises";
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

export const writeFile = async (path: string, code: string, options?: { overwrite?: boolean; format?: boolean }) => {
  if (options?.format !== false) {
    const { default: prettier } = await import("prettier");
    const config = await prettier.resolveConfig(path);
    code = prettier.format(code, { ...config, filepath: path });
  }

  await _writeFile(path, code, {
    flag: options?.overwrite === false ? "wx" : undefined,
  });
};

export const readFile = async (path: string) => {
  try {
    return await _readFile(path, "utf8");
  } catch {}

  return undefined;
};
