import { memoize2 } from "@mo36924/memoize";
import { parse } from "@mo36924/typescript-graphql";
import type { GraphQLSchema, Source } from "graphql";
import { DIAGNOSTIC_SEVERITY, getRange, validateQuery } from "graphql-language-service-interface";
import type { Diagnostic } from "vscode-languageserver-types";

export const diagnostics = memoize2((schema: GraphQLSchema, source: Source) => {
  const documentNode = parse(source);

  if (documentNode instanceof Error) {
    const location = documentNode.locations?.[0] ?? { line: 1, column: 1 };
    const range = getRange(location, source.body);

    const diagnostics: Diagnostic[] = [
      {
        severity: DIAGNOSTIC_SEVERITY.Error,
        message: documentNode.message,
        source: "GraphQL: Syntax",
        range,
      },
    ];

    return diagnostics;
  }

  return validateQuery(documentNode, schema);
});
