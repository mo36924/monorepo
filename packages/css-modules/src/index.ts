import { once } from "events";
import { readFile } from "fs/promises";
import { join, resolve } from "path";
import postcssModules from "@mo36924/postcss-modules";
import { watch } from "chokidar";
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
  loader?: string;
};

export default async (options: Options) => {
  const base = resolve(options.base ?? "");
  const dir = resolve(options.dir ?? "");
  const extname = options.extname ?? ".module.ts";
  const format = options.format;
  const loader = options.loader;
  const watcher = watch(options.include, { cwd: base, ignored: options.exclude });

  const listener = async (path: string) => {
    const from = join(base, path);
    const to = join(dir, path);
    const options = { from, to };

    const [css, { plugins, options: _options }] = await Promise.all([
      readFile(from, "utf8"),
      postcssrc(options).catch(() => ({ plugins: [], options })),
    ]);

    await postcss([...plugins, postcssModules({ to: to + extname, format, loader })]).process(css, _options);
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
