import type { PluginFunction } from "@graphql-codegen/plugin-helpers";
import { TypeScriptPluginConfig as _TypeScriptPluginConfig, plugin as typescript } from "@graphql-codegen/typescript";
import "@mo36924/graphql-codegen-prettier";
import { Source, stripIgnoredCharacters } from "graphql";
// eslint-disable-next-line import/order
import { relative, sep } from "path";

export type TypeScriptPluginConfig = _TypeScriptPluginConfig & { minify?: boolean };

const cwd = process.cwd() + sep;

export const plugin: PluginFunction<TypeScriptPluginConfig> = async (schema, documents, config, info) => {
  let output = await typescript(schema, documents, config, info);
  const isDeclaration = info?.outputFile?.endsWith(".d.ts") ?? true;

  if (isDeclaration) {
    return output;
  }

  let { body, name }: Partial<Source> = schema.astNode?.loc?.source ?? (schema.extensions?.sources as any)?.[0] ?? {};

  if (body === undefined) {
    return output;
  }

  if (config.minify) {
    body = stripIgnoredCharacters(body);
  }

  if (name?.startsWith(cwd)) {
    name = relative(cwd, name);
  } else {
    name = undefined;
  }

  return {
    content: output.content,
    prepend: ['import { Source } from "graphql";\n', ...(output.prepend ?? [])],
    append: [
      ...(output.append ?? []),
      `\n\nexport default new Source(${JSON.stringify(body)}${name ? `, ${JSON.stringify(name)}` : ""});\n\n`,
    ],
  };
};
