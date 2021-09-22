import type { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import { plugin as operations, TypeScriptDocumentsPluginConfig } from "@graphql-codegen/typescript-operations";
import { pascalCase } from "change-case";
import { FragmentDefinitionNode, stripIgnoredCharacters, visit } from "graphql";

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

export type TypeScriptOperationsPluginConfig = TypeScriptDocumentsPluginConfig & { minify?: boolean };

export const plugin: PluginFunction<TypeScriptOperationsPluginConfig> = async (schema, documents, config, info) => {
  const { prepend, content, append } = await operations(
    schema,
    documents,
    { ...config, namingConvention: undefined, operationResultSuffix: "Result" },
    info,
  );

  const output: Required<Types.ComplexPluginOutput> = {
    prepend: prepend ?? [],
    content: content + "\n\n",
    append: append ?? [],
  };

  const isDeclaration = info?.outputFile?.endsWith(".d.ts") ?? true;

  if (isDeclaration) {
    return output;
  }

  const { minify, omitOperationSuffix } = config;

  for (const { document } of documents) {
    if (!document) {
      continue;
    }

    const fragmentDefinitionMap = new Map(
      document.definitions
        .filter((definition): definition is FragmentDefinitionNode => definition.kind === "FragmentDefinition")
        .map((definition) => [
          definition.name.value,
          definition.loc!.source.body.slice(definition.loc!.start, definition.loc!.end),
        ]),
    );

    let i = 1;

    for (const definition of document.definitions) {
      if (definition.kind !== "OperationDefinition") {
        continue;
      }

      const operation = omitOperationSuffix ? "" : pascalCase(definition.operation);
      const name = (definition.name ? pascalCase(definition.name.value) : `Unnamed_${i++}_`) + operation;

      const definitionSet = new Set<string>([
        definition.loc!.source.body.slice(definition.loc!.start, definition.loc!.end),
      ]);

      if (fragmentDefinitionMap.size) {
        visit(definition, {
          FragmentSpread(node) {
            definitionSet.add(fragmentDefinitionMap.get(node.name.value)!);
          },
        });
      }

      let graphql = [...definitionSet].join("\n\n");

      if (minify) {
        graphql = stripIgnoredCharacters(graphql);
      }

      output.content += `export const ${name}: string & { variables?: ${name}Variables, result?: ${name}Result } = ${JSON.stringify(
        graphql,
      )};\n\n`;
    }
  }

  return output;
};
