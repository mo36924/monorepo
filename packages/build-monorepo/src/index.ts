import { bold, cyan, green } from "colorette";
import ms from "pretty-ms";
import { rollup } from "rollup";
import getOptions from "./options";
import warnings from "./warnings";

export default async () => {
  process.env.NODE_ENV = "production";
  const options = await getOptions();

  for (const option of options) {
    const start = Date.now();
    const outputs = Array.isArray(option.output) ? option.output : option.output ? [option.output] : [];
    const outputFiles = outputs.map((output) => output.file || output.dir!).join(", ");
    let inputFiles = "";

    if (typeof option.input === "string") {
      inputFiles = option.input;
    } else if (Array.isArray(option.input)) {
      inputFiles = option.input.join(", ");
    } else if (option.input && typeof option.input === "object") {
      inputFiles = Object.values(option.input).join(", ");
    }

    console.error(cyan(`\n${bold(inputFiles!)} → ${bold(outputFiles)}...`));
    const build = await rollup(option);
    await Promise.all(outputs.map(build.write));
    await build.close();
    warnings.flush();
    console.error(green(`created ${bold(outputFiles)} in ${bold(ms(Date.now() - start))}`));
  }
};
