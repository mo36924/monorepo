import { once } from "events";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import { writeFile } from "@mo36924/util-node";
import { watch } from "chokidar";
import { build } from "esbuild";
import postcss from "postcss";
import postcssrc from "postcss-load-config";

type Options = {
  include: string | string[];
  exclude?: string | string[];
  base?: string;
  dir?: string;
  extname?: string;
  watch?: boolean;
  format?: boolean;
};

export default async (options: Options) => {
  const base = resolve(options.base ?? "");
  const dir = resolve(options.dir ?? "");
  const extname = options.extname ?? ".url.ts";
  const format = options.format;
  const watcher = watch(options.include, { cwd: base, ignored: options.exclude });

  const listener = async (path: string) => {
    if (base === dir && (path.endsWith(".css") || path.endsWith(".js"))) {
      throw new Error(`Cannot be overwritten ${resolve(dir, path)}`);
    }

    if (/\.(css|pcss|postcss|scss)$/.test(path)) {
      const from = join(base, path);
      const to = join(dir, path.replace(/\.(css|pcss|postcss|scss)$/, ".css"));
      const asset = join(dir, path + extname);
      const options = { from, to };

      const [css, { plugins, options: _options }] = await Promise.all([
        readFile(from, "utf8"),
        postcssrc(options).catch(() => ({ plugins: [], options })),
      ]);

      const result = await postcss(plugins).process(css, _options);

      await Promise.all([
        writeFile(to, result.css, { format }),
        writeFile(asset, `export default ${JSON.stringify(pathToFileURL(to).pathname)}`, { format }),
      ]);
    } else if (/\.(tsx|jsx|ts|mjs|js|cjs)$/.test(path)) {
      const from = join(base, path);
      const to = join(dir, path.replace(/\.(tsx|jsx|ts|mjs|js|cjs)$/, ".js"));
      const asset = join(dir, path + extname);

      await Promise.all([
        build({ entryPoints: [from], bundle: true, outfile: to }),
        writeFile(asset, `export default ${JSON.stringify(pathToFileURL(to).pathname)}`, { format }),
      ]);
    }
  };

  if (options.watch) {
    watcher.on("add", listener).on("change", listener);
  } else {
    await once(watcher, "ready");
    const watched = watcher.getWatched();
    const paths = Object.entries(watched).flatMap(([dir, names]) => names.map((name) => join(dir, name)));
    await Promise.all(paths.map(listener));
    await watcher.close();
  }
};
