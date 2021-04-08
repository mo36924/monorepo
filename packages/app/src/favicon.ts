import { readFile } from "fs/promises";
import { favicon } from "@mo36924/config";
import hash from "./hash";

export default async (): Promise<[path: string, data: Buffer]> => {
  try {
    const url = new URL(favicon, "file:///");
    const data = await readFile(url);
    const _hash = hash(data);
    const path = `${_hash}.ico`;
    return [path, data];
  } catch {
    return ["favicon.ico", Buffer.from([])];
  }
};
