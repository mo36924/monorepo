import { resolve } from "path";
import program from "commander";
import app from "./index";

const options = program
  .option("-p, --project <file>", "Compile the project given the path to its configuration file.", "package.json")
  .parse()
  .opts();

// eslint-disable-next-line import/no-dynamic-require
const config = require(resolve(options.project));

app(config.app).catch((err) => {
  process.exitCode = 1;
  console.error(String(err));
});
