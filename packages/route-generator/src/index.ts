import { once } from "events";
import { access, mkdir } from "fs/promises";
import { dirname, extname, relative, resolve, sep } from "path";
import { readFile, writeFile } from "@mo36924/util-node";
import { camelCase } from "change-case";
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
  file: "src/components/Router.tsx",
  dynamicImport: true,
  template: "src/components/Router.template.tsx",
  include: ["**/*.tsx"],
  exclude: ["**/*.(client|server|test|spec).tsx", "**/__tests__/**"],
};

const defaultTemplate = `
// @ts-ignore
import { ComponentType, lazy, Suspense } from "react";
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
/*paths*/
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
  return Route && ([Route, props] as const);
};
export default (props: { pathname: string }) => {
  const matches = match(props.pathname);
  if (matches) {
    const [Component, props] = matches;
    return (
      <Suspense fallback>
        <Component {...props}></Component>
      </Suspense>
    );
  } else {
    return null;
  }
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
    watcher.on("raw", generate);
  } else {
    await watcher.close();
  }

  function pathToRoute(absolutePath: string) {
    const nonExtAbsolutePath = absolutePath.slice(0, -extname(absolutePath).length || undefined);
    const nonExtPath = relative(dir, nonExtAbsolutePath).split(sep).join("/");
    const componentName = camelCase(nonExtPath);
    let pagePath = "/" + nonExtPath.replace(/^index$/, "").replace(/\/index$/, "/");

    const searchTemplate = pagePath
      .replace(/\[([A-Za-z][0-9A-Za-z]*)\]/g, (_m, propName) => {
        return `\${props.${propName}}`;
      })
      .replace(/\[([A-Za-z][0-9A-Za-z]*)_([A-Za-z][0-9A-Za-z]*)\]/g, (_m, propName, _type) => {
        return `\${props.${propName}}`;
      })
      .replace(
        /\[([A-Za-z][0-9A-Za-z]*)_([A-Za-z][0-9A-Za-z]*)_(\$[a-z]+)_([0-9A-Za-z]+)\]/g,
        (_m, propName, _type, _operator, _value) => {
          return `\${props.${propName}}`;
        },
      );

    const rank = pagePath
      .split("/")
      .map((segment) => {
        if (!segment.includes("[")) {
          return 9;
        }

        if (
          /^\[[A-Za-z][0-9A-Za-z]*(_[A-Za-z][0-9A-Za-z]*|_[A-Za-z][0-9A-Za-z]*_\$[a-z]+_[0-9A-Za-z]+)?\]$/.test(segment)
        ) {
          return 8;
        }

        return segment.split(
          /\[[A-Za-z][0-9A-Za-z]*(_[A-Za-z][0-9A-Za-z]*|_[A-Za-z][0-9A-Za-z]*_\$[a-z]+_[0-9A-Za-z]+)?\]/,
        ).length;
      })
      .join("");

    const isDynamic =
      /\[[A-Za-z][0-9A-Za-z]*(_[A-Za-z][0-9A-Za-z]*|_[A-Za-z][0-9A-Za-z]*_\$[a-z]+_[0-9A-Za-z]+)?\]/.test(pagePath);

    const propNames: string[] = [];

    if (isDynamic) {
      pagePath =
        "/^" +
        pagePath
          .replace(/\//g, "\\/")
          .replace(/\[([A-Za-z][0-9A-Za-z]*)\]/g, (_m, propName) => {
            propNames.push(propName);
            return "([^\\/]+?)";
          })
          .replace(/\[([A-Za-z][0-9A-Za-z]*)_([A-Za-z][0-9A-Za-z]*)\]/g, (_m, propName, _type) => {
            propNames.push(propName);
            return "([^\\/]+?)";
          })
          .replace(
            /\[([A-Za-z][0-9A-Za-z]*)_([A-Za-z][0-9A-Za-z]*)_(\$[a-z]+)_([0-9A-Za-z]+)\]/g,
            (_m, propName, _type, _operator, _value) => {
              propNames.push(propName);
              return "([^\\/]+?)";
            },
          ) +
        "$/";
    }

    let importPath = relative(dirname(file), nonExtAbsolutePath).split(sep).join("/");

    if (importPath[0] !== "." && importPath[0] !== "/") {
      importPath = `./${importPath}`;
    }

    return {
      importPath,
      searchTemplate,
      componentName,
      isDynamic,
      pagePath,
      propNames,
      rank,
    };
  }

  async function generateDefaultFile(path: string) {
    const absolutePath = resolve(dir, path);
    let code = await readFile(absolutePath);

    if (code?.trim()) {
      return;
    }

    const { propNames, isDynamic } = pathToRoute(absolutePath);

    if (isDynamic) {
      const propsType = `{${propNames.map((propName) => `${JSON.stringify(propName)}: string`).join()}}`;

      code = `
        export default (props: ${propsType}) => {
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
    const watchedPaths: string[] = [];

    await Promise.allSettled(
      Object.entries(watched)
        .flatMap(([_dir, names]) => names.map((name) => resolve(dir, _dir, name)))
        .map(async (path) => {
          try {
            await access(path);
            watchedPaths.push(path);
          } catch {
            watcher.unwatch(path);
          }
        }),
    );

    const pagePaths = watchedPaths.map((path) => pathToRoute(path)).sort((a, b) => (b.rank as any) - (a.rank as any));
    let imports = "";
    let statics = "";
    let dynamics = "";
    let errors = "";
    let paths = "";

    for (const { importPath, searchTemplate, componentName, pagePath, isDynamic, propNames } of pagePaths) {
      const importSource = JSON.stringify(importPath);
      const propsType = `{${propNames.map((propName) => `${JSON.stringify(propName)}: string`).join()}}`;
      const componentType = `ComponentType<${propsType}>`;

      imports += dynamicImport
        ? `const $${componentName}: ${componentType} = lazy(() => import(${importSource}));`
        : `import $$${componentName} from ${importSource};const $${componentName}: ${componentType} = $$${componentName};`;

      if (isDynamic) {
        dynamics += `[${pagePath},${JSON.stringify(propNames)},$${componentName}],`;
        paths += `export const ${componentName} = (props: ${propsType}) => \`${searchTemplate}\`;`;
      } else if (/^\/[45]\d\d$/.test(pagePath)) {
        errors += `${pagePath.slice(1)}: $${componentName},`;
      } else {
        statics += `${JSON.stringify(pagePath)}: $${componentName},`;
        paths += `export const ${componentName} = ${JSON.stringify(searchTemplate)};`;
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
