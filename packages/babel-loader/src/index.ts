import { access } from "fs/promises";
import { fileURLToPath, pathToFileURL } from "url";
import { promisify } from "util";
import { transformAsync } from "@babel/core";
import { dataToEsm } from "@rollup/pluginutils";
import { createMatchPathAsync, loadConfig } from "tsconfig-paths";

type Resolve = (
  specifier: string,
  context: { parentURL?: string; conditions: string[] },
  defaultResolve: Resolve,
) => { url: string } | Promise<{ url: string }>;

type GetFormat = (
  url: string,
  context: undefined,
  defaultGetFormat: GetFormat,
) => { format: string } | Promise<{ format: string }>;

type GetSource = (
  url: string,
  context: { format: string },
  defaultGetSource: GetSource,
) => { source: string | Uint8Array | SharedArrayBuffer } | Promise<{ source: string | Uint8Array | SharedArrayBuffer }>;

type TransformSource = (
  source: string | Uint8Array | SharedArrayBuffer,
  context: { format: string; url: string },
  defaultTransformSource: TransformSource,
) => { source: string | Uint8Array | SharedArrayBuffer } | Promise<{ source: string | Uint8Array | SharedArrayBuffer }>;

const nodeModulesURL = pathToFileURL("node_modules/").href;
const extensions = [".tsx", ".jsx", ".ts", ".mjs", ".js", ".json"];
const mainFiles = extensions.map((extension) => `index${extension}`);
const dirSuffixes = mainFiles;
const fileSuffixes = ["", ...extensions, ...mainFiles.map((main) => `/${main}`)];

const sourceToString = (source: string | Uint8Array | SharedArrayBuffer) =>
  typeof source === "string" ? source : Buffer.isBuffer(source) ? source.toString() : Buffer.from(source).toString();

const config = loadConfig();

const matchPathAsync =
  config.resultType === "success" && promisify(createMatchPathAsync(config.absoluteBaseUrl, config.paths));

export const resolve: Resolve = async (specifier, context, defaultResolve) => {
  const parentURL = context.parentURL;

  if (parentURL && !parentURL.startsWith(nodeModulesURL)) {
    const path = matchPathAsync && (await matchPathAsync(specifier, undefined, undefined, extensions));

    if (path) {
      specifier = pathToFileURL(path).href;
    }

    if (path || specifier[0] === ".") {
      const suffixes = specifier.endsWith("/") ? dirSuffixes : fileSuffixes;

      const results = await Promise.allSettled(
        suffixes.map(async (suffix) => {
          const url = new URL(specifier + suffix, parentURL);
          await access(url);
          return url.href;
        }),
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          return { url: result.value };
        }
      }
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
};

export const getFormat: GetFormat = (url, context, defaultGetFormat) => {
  if (
    !url.startsWith(nodeModulesURL) &&
    (url.endsWith(".tsx") ||
      url.endsWith(".jsx") ||
      url.endsWith(".ts") ||
      url.endsWith(".mjs") ||
      url.endsWith(".js") ||
      url.endsWith(".json"))
  ) {
    return { format: "module" };
  }

  return defaultGetFormat(url, context, defaultGetFormat);
};

export const transformSource: TransformSource = async (source, context, defaultTransformSource) => {
  const { url, format } = context;

  if (!url.startsWith(nodeModulesURL) && format === "module") {
    if (
      url.endsWith(".tsx") ||
      url.endsWith(".jsx") ||
      url.endsWith(".ts") ||
      url.endsWith(".mjs") ||
      url.endsWith(".js")
    ) {
      const result = await transformAsync(sourceToString(source), {
        sourceMaps: "inline",
        filename: fileURLToPath(url),
      });

      if (result?.code != null) {
        return {
          source: result.code,
        };
      }
    } else if (url.endsWith(".json")) {
      return { source: dataToEsm(JSON.parse(sourceToString(source)), { preferConst: true }) };
    }
  }

  return defaultTransformSource(source, context, defaultTransformSource);
};
