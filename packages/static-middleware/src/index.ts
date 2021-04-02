import { readFile } from "fs/promises";
import { join, resolve } from "path";
import type { MiddlewareFactory } from "@mo36924/http-server";

export default (): MiddlewareFactory => () => {
  const dir = resolve("static");

  return async (request, response) => {
    if (request.method !== "GET" && request.method !== "POST") {
      return;
    }

    const path = join(dir, request.pathname.slice(1));
    let data: Buffer;

    try {
      data = await readFile(path);
    } catch {
      return;
    }

    await response.send(data);
    return true;
  };
};
