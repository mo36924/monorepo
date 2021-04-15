import { rollup } from "rollup";
import getOptions from "./options";
import warnings from "./warnings";

export default async () => {
  process.env.NODE_ENV = "production";
  const options = await getOptions();

  for (const option of options) {
    const build = await rollup(option);
    const outputs = Array.isArray(option.output) ? option.output : option.output ? [option.output] : [];
    await Promise.all(outputs.map(build.write));
    await build.close();
    warnings.flush();
  }
};
