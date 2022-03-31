import type { PluginFunction, Types } from "@graphql-codegen/plugin-helpers";
import { TypeScriptDocumentsPluginConfig, plugin as operations } from "@graphql-codegen/typescript-operations";
import "@mo36924/graphql-codegen-prettier";
import { pascalCase } from "change-case";
import { FragmentDefinitionNode, OperationDefinitionNode, stripIgnoredCharacters, visit } from "graphql";

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
    let firstOperationQueryName!: string;

    const operationDefinitions = document.definitions.filter(
      (definition): definition is OperationDefinitionNode => definition.kind === "OperationDefinition",
    );

    for (const operationDefinition of operationDefinitions) {
      if (operationDefinition.kind !== "OperationDefinition") {
        continue;
      }

      const operation = omitOperationSuffix ? "" : pascalCase(operationDefinition.operation);

      const name =
        (operationDefinition.name ? pascalCase(operationDefinition.name.value) : `Unnamed_${i++}_`) + operation;

      firstOperationQueryName ??= name;

      const definitionSet = new Set<string>([
        operationDefinition.loc!.source.body.slice(operationDefinition.loc!.start, operationDefinition.loc!.end),
      ]);

      if (fragmentDefinitionMap.size) {
        visit(operationDefinition, {
          FragmentSpread(node) {
            definitionSet.add(fragmentDefinitionMap.get(node.name.value)!);
          },
        });
      }

      let graphql = [...definitionSet].join("\n\n");

      if (minify) {
        graphql = stripIgnoredCharacters(graphql);
      }

      output.content += `export const ${name}: string & { variables: ${name}Variables, result: ${name}Result } = ${JSON.stringify(
        graphql,
      )} as any;\n\n`;
    }

    if (operationDefinitions.length === 1) {
      output.content += `export default ${firstOperationQueryName};\n\n`;
    }
  }

  return output;
};
