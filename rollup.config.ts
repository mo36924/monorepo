import { readdir } from "fs/promises";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import { RollupOptions } from "rollup";
import dts from "rollup-plugin-dts";
import shebang from "rollup-plugin-preserve-shebang";

const workspaceDir = "packages";
const external = /^[@\w]/;

const _typescript = typescript({
  declaration: false,
  outDir: undefined,
  sourceMap: true,
  inlineSourceMap: false,
  inlineSources: true,
});

const extensions = [".tsx", ".ts"];
const serverExtensions = [...extensions.map((extension) => ".server" + extension), ...extensions];
const clientExtensions = [...extensions.map((extension) => ".client" + extension), ...extensions];
const serverPlugins = [_typescript, nodeResolve({ extensions: serverExtensions }), shebang()];
const clientPlugins = [_typescript, nodeResolve({ extensions: clientExtensions }), shebang()];

export default async () => {
  const options: RollupOptions[] = [];
  const declarations: { [name: string]: string } = {};
  const names = await readdir(workspaceDir);

  const jsons: [string, any][] = await Promise.all(
    names
      .filter((name) => name[0] !== ".")
      .map(async (name) => [name, await import(`./${workspaceDir}/${name}/package.json`)]),
  );

  for (const [name, json] of jsons) {
    const inputs: { [name: string]: string } = {};

    for (const input of Object.keys(json.exports ?? { ".": {} })) {
      const _input = input.slice(2) || "index";
      inputs[_input] = `${workspaceDir}/${name}/src/${_input}`;
      declarations[`${workspaceDir}/${name}/dist/${_input}`] = `${workspaceDir}/${name}/src/${_input}`;
    }

    options.push(
      {
        input: inputs,
        output: [
          {
            dir: `${workspaceDir}/${name}/dist`,
            format: "module",
            sourcemap: true,
            entryFileNames: "[name].mjs",
            chunkFileNames: "[name]-[hash].mjs",
          },
          {
            dir: `${workspaceDir}/${name}/dist`,
            format: "commonjs",
            sourcemap: true,
            entryFileNames: "[name].cjs",
            chunkFileNames: "[name]-[hash].cjs",
            interop: "auto",
            exports: "auto",
          },
        ],
        external,
        plugins: serverPlugins,
      },
      {
        input: inputs,
        output: {
          dir: `${workspaceDir}/${name}/dist`,
          format: "module",
          sourcemap: true,
          entryFileNames: "[name].js",
          chunkFileNames: "[name]-[hash].js",
        },
        external,
        plugins: clientPlugins,
      },
    );
  }

  options.push({
    input: declarations,
    output: {
      dir: ".",
      format: "module",
    },
    external,
    plugins: [dts(), nodeResolve({ extensions: serverExtensions })],
  });

  return options;
};
