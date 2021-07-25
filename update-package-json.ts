import { readdir, readFile, writeFile } from "fs/promises";
import { builtinModules } from "module";
import { basename, dirname, join, resolve } from "path";
import babel from "@babel/core";
import typescript from "@babel/plugin-syntax-typescript";
import glob from "fast-glob";
import prettier from "prettier";
import sortPackageJson from "sort-package-json";

const { parseAsync, traverse, types } = babel;
const { resolveConfig, format } = prettier;

const getPackageName = (source: string) => {
  return source
    .split("/")
    .slice(0, source[0] === "@" ? 2 : 1)
    .join("/");
};

const [packageJson, packageJsonPaths, prettierOptions] = await Promise.all([
  readFile("package.json", "utf8"),
  glob("packages/*/package.json", { absolute: true }),
  resolveConfig("package.json"),
]);

const pkgs = Object.fromEntries(
  await Promise.all(
    packageJsonPaths.map(
      async (packageJsonPath) => [packageJsonPath, JSON.parse(await readFile(packageJsonPath, "utf8"))] as const,
    ),
  ),
);

const devDependencies = Object.assign(
  Object.create(null) as {},
  JSON.parse(packageJson).devDependencies,
  Object.fromEntries(Object.values(pkgs).map((pkg) => [pkg.name, `^${pkg.version}`])),
);

await Promise.all(
  Object.entries(pkgs).map(async ([packageJsonPath, pkg]) => {
    const sourceDir = join(packageJsonPath, "..", "src");
    const name = basename(dirname(packageJsonPath));
    const dependencies: { [pkg: string]: string } = {};
    const exports: { [key: string]: any } = {};
    const sourceFiles = await glob("**/*.ts", { cwd: sourceDir, ignore: ["**/*.test.ts"] });

    const addDependency = (source: string) => {
      if (source[0] === ".") {
        return;
      }

      const packageName = getPackageName(source);

      if (devDependencies[packageName]) {
        dependencies[packageName] = devDependencies[packageName];
      } else if (!builtinModules.includes(packageName)) {
        console.log(`There is no ${packageName} installed on ${name}. Please install the ${packageName}.`);
      }
    };

    pkg = {
      ...pkg,
      type: undefined,
      dependencies: undefined,
      devDependencies: undefined,
      peerDependencies: undefined,
    };

    if (sourceFiles.includes("index.ts")) {
      pkg.main = "./dist/index.js";
      pkg.module = "./dist/index.mjs";
      exports.require = "./dist/index.js";
      exports.import = "./dist/index.mjs";
    }

    if (sourceFiles.includes("index.client.ts")) {
      pkg.browser = "./dist/index.client.js";
      exports.browser = "./dist/index.client.js";
    }

    if (sourceFiles.includes("bin.ts")) {
      pkg.bin = {
        [name]: "./dist/bin.js",
      };
    }

    if (Object.keys(exports).length) {
      pkg.exports = {
        ...{
          ".": undefined,
          ...pkg.exports,
        },
        ".": {
          browser: undefined,
          import: undefined,
          require: undefined,
          ...exports,
        },
      };
    }

    await Promise.all(
      sourceFiles.map(async (sourceFile) => {
        const path = join(sourceDir, sourceFile);
        const code = await readFile(path, "utf8");
        const ast = await parseAsync(code, { sourceType: "module", plugins: [typescript], filename: path });

        traverse(ast, {
          ModuleDeclaration({ node }) {
            if ("source" in node && node.source) {
              addDependency(node.source.value);
            }
          },
          Import({ parent }) {
            if (types.isCallExpression(parent) && types.isStringLiteral(parent.arguments[0])) {
              addDependency(parent.arguments[0].value);
            }
          },
        });
      }),
    );

    if (Object.keys(dependencies).length) {
      pkg.dependencies = dependencies;
    }

    const formattedCode = format(JSON.stringify(sortPackageJson(pkg)), {
      ...prettierOptions,
      filepath: packageJsonPath,
    });

    await writeFile(packageJsonPath, formattedCode);
  }),
);
