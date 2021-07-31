import { exec as _exec } from "child_process";
import { mkdir, readFile as _readFile, writeFile as _writeFile } from "fs/promises";
import { AddressInfo, createServer } from "net";
import { dirname, extname } from "path";
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

export const writeFile = async (
  path: string,
  data: string | Uint8Array,
  options?: { overwrite?: boolean; format?: boolean },
) => {
  if (options?.format !== false) {
    const { default: prettier } = await import("prettier");
    const config = await prettier.resolveConfig(path);

    if (typeof data !== "string") {
      if (Buffer.isBuffer(data)) {
        data = data.toString();
      } else {
        data = Buffer.from(data).toString();
      }
    }

    data = prettier.format(data, {
      ...config,
      filepath: path,
    });
  }

  const writeOpiotns = { flag: options?.overwrite === false ? "wx" : undefined };

  try {
    await _writeFile(path, data, writeOpiotns);
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await _writeFile(path, data, writeOpiotns);
  }
};

export const readFile = async (path: string) => {
  try {
    return await _readFile(path, "utf8");
  } catch {}

  return undefined;
};

export const removeExtension = (path: string) => path.slice(0, -extname(path).length);
export const normalizePath = (path: string) => path.split("\\").join("/");
