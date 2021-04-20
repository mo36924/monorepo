import { codegen } from "@graphql-codegen/core";
import * as typescriptPlugin from "@graphql-codegen/typescript";
import { format, resolveConfig } from "@mo36924/prettier";
import { parse } from "graphql";

export const typescript = async (schema: string) => {
  const scalars = {
    ID: "string",
    String: "string",
    Boolean: "boolean",
    Int: "number",
    Float: "number",
    UUID: "string",
    Date: "globalThis.Date",
  };

  let typescriptDeclarationSource = await codegen({
    filename: "graphql.d.ts",
    schema: parse(schema),
    plugins: [
      {
        typescript: {
          noExport: true,
          scalars,
          namingConvention: "keep",
        },
      },
    ],
    pluginMap: { typescript: typescriptPlugin },
    config: {},
    documents: [],
  });

  const scalarTypes = `${Object.entries(scalars)
    .map(([graphqlType, typescriptType]) => `type ${graphqlType} = ${typescriptType};`)
    .join("")}`;

  typescriptDeclarationSource = `export type {}; declare global { declare namespace GraphQL { ${scalarTypes} ${typescriptDeclarationSource} } }`;
  const config = await resolveConfig("index.d.ts");
  typescriptDeclarationSource = format(typescriptDeclarationSource, { ...config, filepath: "index.d.ts" });
  return typescriptDeclarationSource;
};
