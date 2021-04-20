import { readFile } from "fs/promises";
import type { Config } from "@mo36924/config";
import hash from "./hash";

export default async (config: Config): Promise<[path: string, data: Buffer]> => {
  try {
    const data = await readFile(config.favicon);
    return [`${hash(data)}.ico`, data];
  } catch {
    return ["favicon.ico", Buffer.from([])];
  }
};
