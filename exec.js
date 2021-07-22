import { readFileSync } from "fs";
import { Worker } from "worker_threads";
import { buildSync } from "esbuild";

const outfile = "./node_modules/.cache/tmp.mjs";
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const external = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });

buildSync({
  entryPoints: [process.argv[2]],
  outfile,
  bundle: true,
  platform: "node",
  external,
  format: "esm",
  sourcemap: "inline",
});

new Worker(outfile, {
  argv: process.argv.slice(3),
  execArgv: ["--enable-source-maps"],
}).on("error", console.error);
