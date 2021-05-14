import { readFile } from "fs/promises";
import type { MiddlewareFactory } from "@mo36924/http-server";
import forms from "@tailwindcss/forms";
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
    plugins.push(postcssImport(), tailwindcss({ plugins: [forms] }));
  }

  return async ({ path, pathname, extname, headers }, res) => {
    if (!path || extname !== ".css") {
      return;
    }

    if (headers["sec-fetch-dest"] !== "style") {
      await res.type("js").send(`export default ${JSON.stringify(pathname)};`);
      return;
    }

    let css = cache.css.style[path];

    if (css == null) {
      const data = await readFile(path, "utf8");
      const { css: _css } = await postcss(...plugins).process(data, { from: path });
      css = cache.css.style[path] = _css;
    }

    await res.type("css").send(css);
  };
};
