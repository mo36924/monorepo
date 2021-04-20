import { once } from "events";
import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, extname, relative, resolve, sep } from "path";
import { format as _format, resolveConfig } from "@mo36924/prettier";
import { watch } from "chokidar";

export type Options = {
  watch?: boolean;
  dir?: string;
  file?: string;
  include?: string[];
  exclude?: string[];
};

const defaultOptions: Required<Options> = {
  watch: process.env.NODE_ENV !== "production",
  dir: "pages",
  file: "lib/pages.ts",
  include: ["**/*.tsx"],
  exclude: ["**/*.(client|server|test|spec).tsx", "**/__tests__/**"],
};

export default async (options?: Options) => {
  const { watch: watchMode, dir, file, include, exclude } = {
    ...defaultOptions,
    ...options,
  };

  await Promise.all([mkdir(dir, { recursive: true }), mkdir(dirname(file), { recursive: true })]);

  const watcher = watch(include, { cwd: dir, ignored: exclude });
  watcher.on("add", generateDefaultFile);
  watcher.on("change", generateDefaultFile);

  await once(watcher, "ready");
  await generate();

  if (watchMode) {
    watcher.on("add", generate);
    watcher.on("unlink", generate);
    watcher.on("unlinkDir", generate);
  } else {
    await watcher.close();
  }

  function pathToRoute(path: string) {
    const absolutePath = resolve(path);
    const nonExtAbsolutePath = absolutePath.slice(0, -extname(absolutePath).length || undefined);
    const nonExtPath = relative(dir, nonExtAbsolutePath).split(sep).join("/");

    let pagePath =
      "/" +
      nonExtPath
        .replace(/^index$/, "")
        .replace(/\/index$/, "/")
        .replace(/__|_/g, (m) => (m === "_" ? ":" : "_"));

    const rank = pagePath
      .split("/")
      .map((segment) => {
        if (!segment.includes(":")) {
          return 9;
        }

        if (segment[0] !== ":") {
          return 8;
        }

        return segment.split(":").length;
      })
      .join("");

    const isDynamic = pagePath.includes(":");
    const paramNames: string[] = [];

    if (isDynamic) {
      pagePath =
        "/^" +
        pagePath.replace(/\//g, "\\/").replace(/\:([A-Za-z][0-9A-Za-z]*)/g, (_m, p1) => {
          paramNames.push(p1);
          return "([^\\/]+?)";
        }) +
        "$/";
    }

    let importPath = relative(dirname(file), nonExtAbsolutePath).split(sep).join("/");

    if (importPath[0] !== "." && importPath[0] !== "/") {
      importPath = `./${importPath}`;
    }

    return {
      importPath,
      isDynamic,
      pagePath,
      paramNames,
      rank,
    };
  }

  async function generateDefaultFile(path: string) {
    const absolutePath = resolve(dir, path);
    let code = await readFile(absolutePath, "utf8");

    if (code.trim() !== "") {
      return;
    }

    const { paramNames, isDynamic } = pathToRoute(absolutePath);

    if (isDynamic) {
      const params = paramNames.map((name) => `${name}: string`).join();

      code = `
        export default (props: { ${params} }) => {
          return (
            <div></div>
          )
        }
      `;
    } else {
      code = `
        export default () => {
          return (
            <div></div>
          )
        }
      `;
    }

    code = await format(code, absolutePath);
    await writeFile(absolutePath, code);
  }

  async function generate() {
    const watched = watcher.getWatched();

    const pagePaths = Object.entries(watched)
      .flatMap(([_dir, names]) => names.map((name) => pathToRoute(resolve(dir, _dir, name))))
      .sort((a, b) => (b.rank as any) - (a.rank as any));

    const staticPages: string[] = [];
    const dynamicPages: string[] = [];
    const errorPages: string[] = [];

    for (const { importPath, pagePath, isDynamic, paramNames } of pagePaths) {
      if (isDynamic) {
        const params = paramNames.map((name) => `${name}: string`).join();

        dynamicPages.push(
          `[${pagePath}, ${JSON.stringify(paramNames)}, (): PromisePageModule<{${params}}> => import('${importPath}')]`,
        );
      } else if (/^\/[45]\d\d$/.test(pagePath)) {
        errorPages.push(`${pagePath.slice(1)}: (): PromisePageModule<any> => import('${importPath}')`);
      } else {
        staticPages.push(`'${pagePath}': (): PromisePageModule<any> => import('${importPath}')`);
      }
    }

    let code = `
      export const staticPages = {
        ${staticPages.join()}
      };
      export const dynamicPages = [
        ${dynamicPages.join()}
      ];
      export const errorPages = {
        ${errorPages.join()}
      };
    `;

    code = await format(code, file);
    await writeFileAsync(file, code);
  }
};

async function format(code: string, filepath: string) {
  const prettierConfig = await resolveConfig(filepath);
  return _format(code, { ...prettierConfig, filepath });
}

async function writeFileAsync(path: string, data: string) {
  try {
    await writeFile(path, data);
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
  }
}
