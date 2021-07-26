import { once } from "events";
import { mkdir } from "fs/promises";
import { dirname, extname, relative, resolve, sep } from "path";
import { readFile, writeFile } from "@mo36924/util-node";
import { watch } from "chokidar";

export type Options = {
  watch?: boolean;
  dir?: string;
  file?: string;
  dynamicImport?: boolean;
  template?: string;
  include?: string[];
  exclude?: string[];
};

const defaultOptions: Required<Options> = {
  watch: process.env.NODE_ENV !== "production",
  dir: "src/routes",
  file: "src/lib/router.ts",
  dynamicImport: true,
  template: "src/lib/router.template.ts",
  include: ["**/*.tsx"],
  exclude: ["**/*.(client|server|test|spec).tsx", "**/__tests__/**"],
};

const defaultTemplate = `
import { ComponentType, lazy } from "react";
/*imports*/
export const statics: { [pathname: string]: ComponentType<any> | undefined } = {
  /*statics*/
};
export const dynamics: [pathnameRegExp: RegExp, propNames: string[], Component: ComponentType<any>][] = [
  /*dynamics*/
];
export const errors: { [pathname: string]: ComponentType<any> | undefined } = {
  /*errors*/
};
export const paths = {
  /*paths*/
};
export const match = (pathname: string) => {
  const props: { [name: string]: string } = {};
  let Route = statics[pathname];
  if (!Route) {
    dynamics.some((dynamic) => {
      const matches = pathname.match(dynamic[0]);
      if (matches) {
        dynamic[1].forEach((name, index) => (props[name] = matches[index + 1]));
        Route = dynamic[2];
        return true;
      }
    });
  }
  return [Route, props] as const;
};
`;

export default async (options?: Options) => {
  const {
    watch: _watch,
    dir,
    file,
    template,
    dynamicImport,
    include,
    exclude,
  } = {
    ...defaultOptions,
    ...options,
  };

  await Promise.all([
    mkdir(dir, { recursive: true }),
    mkdir(dirname(file), { recursive: true }),
    writeFile(template, defaultTemplate, { overwrite: false }),
  ]);

  const watcher = watch(include, { cwd: dir, ignored: exclude });
  await once(watcher, "ready");
  await generate();

  if (_watch) {
    watcher.on("add", generateDefaultFile);
    watcher.on("change", generateDefaultFile);
    watcher.on("add", generate);
    watcher.on("unlink", generate);
    watcher.on("unlinkDir", generate);
  } else {
    await watcher.close();
  }

  function pathToRoute(absolutePath: string) {
    const nonExtAbsolutePath = absolutePath.slice(0, -extname(absolutePath).length || undefined);
    const nonExtPath = relative(dir, nonExtAbsolutePath).split(sep).join("/");
    const componentName = "$" + nonExtPath.replace(/[\/\-]/g, "$");
    const searchPath = "/" + nonExtPath.replace(/^index$/, "").replace(/\/index$/, "/");

    const searchTemplate = searchPath
      .replace(/__|_/g, (m) => (m === "_" ? ":" : "_"))
      .replace(/\:([A-Za-z][0-9A-Za-z]*)/g, (_m, p1) => {
        return `\${props.${p1}}`;
      });

    let pagePath = searchPath.replace(/__|_/g, (m) => (m === "_" ? ":" : "_"));

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
      searchPath,
      searchTemplate,
      componentName,
      isDynamic,
      pagePath,
      paramNames,
      rank,
    };
  }

  async function generateDefaultFile(path: string) {
    const absolutePath = resolve(dir, path);
    let code = await readFile(absolutePath);

    if (code?.trim()) {
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

    await writeFile(absolutePath, code);
  }

  async function generate() {
    const watched = watcher.getWatched();

    const pagePaths = Object.entries(watched)
      .flatMap(([_dir, names]) => names.map((name) => pathToRoute(resolve(dir, _dir, name))))
      .sort((a, b) => (b.rank as any) - (a.rank as any));

    let imports = "";
    let statics = "";
    let dynamics = "";
    let errors = "";
    let paths = "";

    for (const {
      importPath,
      searchPath,
      searchTemplate,
      componentName,
      pagePath,
      isDynamic,
      paramNames,
    } of pagePaths) {
      const importSource = JSON.stringify(importPath);
      const propsType = `{${paramNames.map((name) => `${name}: string`).join()}}`;
      const componentType = `ComponentType<${propsType}>`;

      imports += dynamicImport
        ? `const ${componentName}: ${componentType} = lazy(() => import(${importSource}));`
        : `import $${componentName} from ${importSource};const ${componentName}: ${componentType} = $${componentName};`;

      if (isDynamic) {
        dynamics += `[${pagePath},${JSON.stringify(paramNames)},${componentName}],`;
        paths += `${JSON.stringify(searchPath)}: (props: ${propsType}) => \`${searchTemplate}\`,`;
      } else if (/^\/[45]\d\d$/.test(pagePath)) {
        errors += `${pagePath.slice(1)}: ${componentName},`;
      } else {
        statics += `${JSON.stringify(pagePath)}: ${componentName},`;
        paths += `${JSON.stringify(searchPath)}: ${JSON.stringify(searchTemplate)},`;
      }
    }

    let code = await readFile(template);

    if (code === undefined) {
      await writeFile(template, defaultTemplate);
      code = defaultTemplate;
    }

    code = Object.entries({ imports, statics, dynamics, errors, paths }).reduce(
      (code, [key, value]) => code.replace(`/*${key}*/`, () => value),
      code,
    );

    await writeFile(file, code);
  }
};
