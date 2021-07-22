import { execSync } from "child_process";
import { readFileSync, unlinkSync } from "fs";
import { buildSync } from "esbuild";

const outfile = "rollup.config.mjs";
const pkg = JSON.parse(readFileSync("package.json", "utf-8"));
const external = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });

buildSync({
  entryPoints: ["rollup.config.ts"],
  outfile,
  bundle: true,
  platform: "node",
  external,
  format: "esm",
});

execSync(`node_modules/.bin/rollup -c ${outfile}`, { stdio: "inherit" });
unlinkSync(outfile);
