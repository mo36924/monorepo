import { readFile, stat } from "fs/promises";
import { extname } from "path";
import purgecss from "@fullhuman/postcss-purgecss";
import type { Config } from "@mo36924/config";
import forms from "@tailwindcss/forms";
import cssnano from "cssnano";
import postcss, { AcceptedPlugin } from "postcss";
import postcssImport from "postcss-import";
import loadConfig from "postcss-load-config";
import type { OutputChunk } from "rollup";
import tailwindcss from "tailwindcss";
import hash from "./hash";

export default async (config: Config, chunks: OutputChunk[]) => {
  const content = chunks.map(({ code }) => ({ raw: code, extension: "js" }));
  const cssPaths = new Set(chunks.flatMap((chunk) => Object.keys(chunk.modules).filter((id) => id.endsWith(".css"))));
  const plugins: AcceptedPlugin[] = [];
  const files: { [path: string]: string } = Object.create(null);
  const caches: { [pathname: string]: string | Buffer } = Object.create(null);
  const pathnames: { [path: string]: string } = Object.create(null);

  try {
    const path = config.css;
    const stats = await stat(path);

    if (stats.isFile()) {
      cssPaths.add(path);
    }
  } catch {}

  try {
    const postcssConfig = await loadConfig();
    plugins.push(...postcssConfig.plugins);
  } catch {
    plugins.push(
      postcssImport(),
      // TODO https://github.com/tailwindlabs/tailwindcss/pull/4272
      tailwindcss({ purge: false, plugins: [forms] }),
      purgecss({ content }),
      cssnano({ preset: "advanced" }),
    );
  }

  await Promise.all(
    [...cssPaths].map(async (path) => {
      const data = await readFile(path, "utf8");
      const { css } = await postcss(plugins).process(data, { from: path });
      files[path] = css;
    }),
  );

  for (const [path, data] of Object.entries(files)) {
    const name = hash(data);
    const ext = extname(path);
    const pathname = `/${name}${ext}`;
    caches[pathname] = data;
    pathnames[path] = pathname;
  }

  return { caches, pathnames };
};
