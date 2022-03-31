import { access } from "fs/promises";
import { fileURLToPath } from "url";
import nodeExternals from "@mo36924/esbuild-plugin-node-externals";
import { build } from "esbuild";

export type Resolve = (
  specifier: string,
  context: { conditions: string[]; parentURL: string | undefined },
  defaultResolve: Resolve,
) => Promise<{ format?: string | null; url: string }>;

export type Load = (
  url: string,
  context: { format: string },
  defaultLoad: Load,
) => Promise<{ format: string; source: string | ArrayBuffer | SharedArrayBuffer | Uint8Array }>;

export const resolve: Resolve = async (specifier, context, defaultResolve) => {
  if (!context.parentURL) {
    const _specifier = specifier.endsWith("/") ? specifier : specifier + "/";

    const results = await Promise.all(
      [_specifier + "index.ts", _specifier + "index.tsx"].map((url) =>
        access(fileURLToPath(url)).then(
          () => url,
          () => {},
        ),
      ),
    );

    const url = results.find((url) => url);

    if (url) {
      return { url };
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
};

export const load: Load = async (url, context, defaultLoad) => {
  if (url.endsWith(".ts") || url.endsWith(".tsx")) {
    const path = fileURLToPath(url);

    const result = await build({
      entryPoints: [path],
      platform: "node",
      format: "esm",
      target: `node${process.version.slice(1)}`,
      bundle: true,
      sourcemap: "inline",
      write: false,
      outfile: path + ".mjs",
      allowOverwrite: true,
      plugins: [nodeExternals()],
    });

    return { format: "module", source: result.outputFiles[0].contents };
  }

  return defaultLoad(url, context, defaultLoad);
};
