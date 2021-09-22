import { once } from "events";
import { access, mkdir } from "fs/promises";
import { dirname, relative, resolve, sep } from "path";
import { readFile, writeFile } from "@mo36924/util-node";
import { camelCase } from "change-case";
import { watch } from "chokidar";

export type Options = {
  watch?: boolean;
  dir?: string;
  file?: string;
  dynamicImport?: boolean | string;
  template?: string;
  routeTemplate?: string;
  routeType?: string;
  bracket?: boolean;
  removeRoutePathExtensions?: string[];
  removeImportPathExtensions?: string[];
  include?: string[];
  exclude?: string[];
};

const defaultOptions: Required<Options> = {
  watch: process.env.NODE_ENV !== "production",
  dir: "src/routes",
  file: "src/components/Router.tsx",
  dynamicImport: "lazy",
  template: "src/components/Router.template.tsx",
  routeTemplate: "src/components/Route.template.tsx",
  routeType: "ComponentType",
  bracket: false,
  removeRoutePathExtensions: [".tsx"],
  removeImportPathExtensions: [".tsx"],
  include: ["**/*.tsx"],
  exclude: ["**/*.(client|server|test|spec).tsx", "**/__tests__/**"],
};

const defaultReactTemplate = `
import { ComponentType, lazy, Suspense } from "react";
/*imports*/
/*declarations*/
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

const defaultVueTemplate = `
import { Component, h } from "vue";
/*imports*/

type ComponentType<T = any> = Component<T>;
/*declarations*/

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
    return h(Component, props);
  } else {
    return null;
  }
};
`;

const defaultReactRouteTemplate = `
export default (/*props:{props}*/) => {
  return (
    <div>Hello World!</div>
  )
}
`;

const defaultVueRouteTemplate = `
<script setup lang="ts">
defineProps/*<{props}>*/();
</script>

<style scoped lang="scss">
div {
  font-size: 16px;
}
</style>

<template>
  <div>Hello World!</div>
</template>
`;

const removeExtension = (path: string, extensions: string[] = []) => {
  const extension = extensions.find((extension) => path.endsWith(extension));

  if (extension) {
    path = path.slice(0, -extension.length);
  }

  return path;
};

export default async (options?: Options) => {
  const {
    watch: _watch,
    dir,
    file,
    template,
    routeTemplate,
    routeType,
    dynamicImport,
    bracket,
    removeRoutePathExtensions,
    removeImportPathExtensions,
    include,
    exclude,
  } = {
    ...defaultOptions,
    ...options,
  };

  const [defaultTemplate, defaultRouteTemplate] = include.some((glob) => glob.endsWith(".vue"))
    ? [defaultVueTemplate, defaultVueRouteTemplate]
    : [defaultReactTemplate, defaultReactRouteTemplate];

  await Promise.allSettled([
    mkdir(dir, { recursive: true }),
    mkdir(dirname(file), { recursive: true }),
    writeFile(template, defaultTemplate, { overwrite: false }),
    writeFile(routeTemplate, defaultRouteTemplate, { overwrite: false }),
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
    // watcher.on("raw", generate);
  } else {
    await watcher.close();
  }

  function pathToRoute(absolutePath: string) {
    const nonExtAbsolutePath = removeExtension(absolutePath, removeRoutePathExtensions);
    const nonExtPath = relative(dir, nonExtAbsolutePath).split(sep).join("/");
    const componentName = camelCase(nonExtPath);
    const props: { [name: string]: string } = {};

    let pagePath =
      "/" +
      nonExtPath
        .replace(/^index$/, "")
        .replace(/\/index$/, "/")
        .replace(
          bracket
            ? /\[([A-Za-z][0-9A-Za-z]*)(?:_([A-Za-z][0-9A-Za-z]*))?\]/g
            : /__|_([A-Za-z][0-9A-Za-z]*)(?:_([A-Za-z][0-9A-Za-z]*))?/g,
          (match, name, type = "string") => {
            if (match === "__") {
              return "_";
            }

            props[name] = type;
            return `:${name}`;
          },
        );

    const searchTemplate = pagePath.replace(/\:([A-Za-z][0-9A-Za-z]*)/g, (_m, name) => {
      return `\${props.${name}}`;
    });

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

    if (isDynamic) {
      pagePath = "/^" + pagePath.replace(/\//g, "\\/").replace(/\:([A-Za-z][0-9A-Za-z]*)/g, () => "([^\\/]+?)") + "$/";
    }

    let importPath = relative(dirname(file), removeExtension(absolutePath, removeImportPathExtensions))
      .split(sep)
      .join("/");

    if (importPath[0] !== "." && importPath[0] !== "/") {
      importPath = `./${importPath}`;
    }

    return {
      importPath,
      searchTemplate,
      componentName,
      isDynamic,
      pagePath,
      props,
      rank,
    };
  }

  async function generateDefaultFile(path: string) {
    const absolutePath = resolve(dir, path);
    let code = await readFile(absolutePath);

    if (code?.trim()) {
      return;
    }

    const { props } = pathToRoute(absolutePath);

    const propsType = `{${Object.entries(props)
      .map(([name, type]) => `${JSON.stringify(name)}: ${type}`)
      .join()}}`;

    code = await readFile(routeTemplate);

    if (code === undefined) {
      await writeFile(routeTemplate, defaultRouteTemplate);
      code = defaultRouteTemplate;
    }

    code = code
      .replace("/*props*/", () => propsType)
      .replace(/\/\*(.*?){props}(.*?)\*\//, (_m, p1, p2) => `${p1}${propsType}${p2}`);

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
    let declarations = "";
    let statics = "";
    let dynamics = "";
    let errors = "";
    let paths = "";

    for (const { importPath, searchTemplate, componentName, pagePath, isDynamic, props } of pagePaths) {
      const importSource = JSON.stringify(importPath);

      const propsType = `{${Object.entries(props)
        .map(([name, type]) => `${JSON.stringify(name)}: ${type}`)
        .join()}}`;

      const componentType = `${routeType}<${propsType}>`;

      if (dynamicImport) {
        if (dynamicImport === true) {
          declarations += `const $${componentName}: ${componentType} = () => import(${importSource});`;
        } else {
          declarations += `const $${componentName}: ${componentType} = ${dynamicImport}(() => import(${importSource}));`;
        }
      } else {
        imports += `import $$${componentName} from ${importSource};`;
        declarations += `const $${componentName}: ${componentType} = $$${componentName};`;
      }

      if (isDynamic) {
        dynamics += `[${pagePath},${JSON.stringify(Object.keys(props))},$${componentName}],`;
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

    code = Object.entries({ imports, declarations, statics, dynamics, errors, paths }).reduce(
      (code, [key, value]) => code.replace(`/*${key}*/`, () => value),
      code,
    );

    await writeFile(file, code);
  }
};
