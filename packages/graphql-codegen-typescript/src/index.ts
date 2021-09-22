import type { PluginFunction } from "@graphql-codegen/plugin-helpers";
import { plugin as typescript, TypeScriptPluginConfig as _TypeScriptPluginConfig } from "@graphql-codegen/typescript";
import "@mo36924/graphql-codegen-prettier";
import { stripIgnoredCharacters } from "graphql";

export type TypeScriptPluginConfig = _TypeScriptPluginConfig & { minify?: boolean };

export const plugin: PluginFunction<TypeScriptPluginConfig> = async (schema, documents, config, info) => {
  let output = await typescript(schema, documents, config, info);
  const isDeclaration = info?.outputFile?.endsWith(".d.ts") ?? true;

  if (isDeclaration) {
    return output;
  }

  let { body, name } = schema.astNode?.loc?.source ?? {};

  if (body === undefined) {
    return output;
  }

  if (config.minify) {
    body = stripIgnoredCharacters(body);
  }

  return {
    content: output.content,
    prepend: ['import { Source } from "graphql";\n', ...(output.prepend ?? [])],
    append: [
      ...(output.append ?? []),
      `\n\nexport default new Source(${JSON.stringify(body)}, ${JSON.stringify(name)});\n\n`,
    ],
  };
};
