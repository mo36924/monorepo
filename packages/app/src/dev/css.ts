import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import type { MiddlewareFactory } from "@mo36924/http-server";
import postcss, { AcceptedPlugin } from "postcss";
import postcssImport from "postcss-import";
import loadConfig from "postcss-load-config";
import tailwindcss from "tailwindcss";
import type { Cache } from "./cache";

export default ({ cache }: { cache: Cache }): MiddlewareFactory => async () => {
  const plugins: AcceptedPlugin[] = [];

  try {
    const config = await loadConfig();
    plugins.push(...config.plugins);
  } catch {
    plugins.push(postcssImport(), tailwindcss());
  }

  return async (req, res) => {
    if (req.extname !== ".css") {
      return;
    }

    const path = fileURLToPath(new URL(req._url, "file:///"));

    if (req.headers["sec-fetch-dest"] === "script") {
      // TODO
    }

    if (path in cache.css.style) {
      await res.send(cache.css.style[path]);
      return;
    }

    const data = readFile(path, "utf8");
    const { css } = await postcss(...plugins).process(data, { from: path });
    cache.css.style[path] = css;
    await res.send(css);
  };
};
