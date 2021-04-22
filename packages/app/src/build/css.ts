import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import purgecss from "@fullhuman/postcss-purgecss";
import type { Config } from "@mo36924/config";
import cssnano from "cssnano-preset-advanced";
import postcss from "postcss";
import _import from "postcss-import";
import hash from "./hash";

export default async (
  config: Config,
  content?: { extension: string; raw: string }[],
): Promise<[path: string, data: string]> => {
  let css: string;
  const path = fileURLToPath(`file://${config.css}`);

  try {
    css = await readFile(path, "utf8");
  } catch {
    return ["index.css", "data:image/x-icon;base64,"];
  }

  const { css: _css } = await postcss(_import() as any, cssnano(), purgecss({ content })).process(css, {
    from: path,
  });

  return [`${hash(_css)}.css`, _css];
};
