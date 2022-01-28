#!/usr/bin/env node
import { program } from "commander";
import index from "./index";

program
  .name("css-modules")
  .argument("<glob...>", "Glob pattern")
  .option("-e, --exclude <glob...>", "Exclude glob pattern")
  .option("-d, --dir <dir>", "Output directory")
  .option("-b, --base <dir>", "Mirror the directory structure relative to this path in the output directory")
  .option("-x, --extname <extname>", "Override the output file extension")
  .option("-w, --watch", "Watch files for changes and recompile as needed")
  .option("-f, --format", "Format output file")
  .option("-l, --loader <loader>", "Loader")
  .parse();

index({ ...program.opts(), include: program.args }).catch((e) => {
  process.exitCode = 1;
  console.log(e);
});
