import { readFile } from "fs/promises";
import { join } from "path";
import type { MiddlewareFactory } from "@mo36924/http-server";

export default (): MiddlewareFactory => () => {
  return async (request, response) => {
    if (request.method !== "GET" && request.method !== "POST") {
      return;
    }

    let data: Buffer;

    try {
      data = await readFile(join("static", request.pathname));
    } catch {
      return;
    }

    await response.send(data);
    return true;
  };
};
