import type { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";

try {
  const prettier = require("prettier");
  const core = require("@graphql-codegen/core");
  const codegen = core.codegen;

  core.codegen = async (options: Types.GenerateOptions) => {
    const code = await codegen(options);
    const filepath = options.filename;
    const config = await prettier.resolveConfig(filepath);
    const formattedCode = prettier.format(code, { ...config, filepath });
    return formattedCode;
  };
} catch {}

export const plugin: PluginFunction = async () => {
  return "";
};
