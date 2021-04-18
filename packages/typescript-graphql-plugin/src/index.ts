import { factory, isGraphqlTag, query as _query, source, watchSchema } from "@mo36924/typescript-graphql";
import {
  getAutocompleteSuggestions,
  getHoverInformation,
  getTokenAtPosition,
} from "graphql-language-service-interface";
import { Position } from "graphql-language-service-utils";
import type { GetCompletionsAtPositionOptions, LanguageService, server } from "typescript/lib/tsserverlibrary";
import { CompletionItemKind } from "vscode-languageserver-types";
import { diagnosticCategory } from "./diagnostic-category";
import { diagnostics } from "./diagnostics";
import { hover } from "./hover";
import { sourceFile } from "./source-file";

const init: server.PluginModuleFactory = ({ typescript: ts }) => {
  let schema = watchSchema((_schema) => {
    schema = _schema;
    taggedTemplateExpressionHook = factory(schema);
  });

  let taggedTemplateExpressionHook = factory(schema);
  ts.taggedTemplateExpressionHooks.push((ts, node, checker) => taggedTemplateExpressionHook(ts, node, checker));

  return {
    create(info) {
      const languageService = info.languageService;
      const proxy: LanguageService = Object.create(null);

      for (const [key, value] of Object.entries(languageService)) {
        (proxy as any)[key] = value.bind(languageService);
      }

      proxy.getQuickInfoAtPosition = (fileName: string, position: number) => {
        const _sourceFile = sourceFile(languageService, fileName);

        if (!_sourceFile) {
          return;
        }

        const tag = hover(ts, _sourceFile, position);

        if (!tag) {
          return languageService.getQuickInfoAtPosition(fileName, position);
        }

        const { query, offset } = _query(ts, schema, tag);
        const cursor = new Position(0, position - offset + 1);
        const token = getTokenAtPosition(query, cursor);
        const result = getHoverInformation(schema, query, cursor, token);

        if (result === "" || typeof result !== "string") {
          return;
        }

        return {
          kind: ts.ScriptElementKind.string,
          textSpan: {
            start: offset + token.start,
            length: token.end - token.start,
          },
          kindModifiers: "",
          displayParts: [{ text: result, kind: "" }],
        };
      };

      proxy.getCompletionsAtPosition = (
        fileName: string,
        position: number,
        options: GetCompletionsAtPositionOptions | undefined,
      ) => {
        const _sourceFile = sourceFile(languageService, fileName);

        if (!_sourceFile) {
          return;
        }

        const tag = hover(ts, _sourceFile, position);

        if (!tag) {
          return languageService.getCompletionsAtPosition(fileName, position, options);
        }

        const { query, offset } = _query(ts, schema, tag);
        const cursor = new Position(0, position - offset);
        const token = getTokenAtPosition(query, cursor);
        const items = getAutocompleteSuggestions(schema, query, cursor, token);

        if (!items.length) {
          return;
        }

        return {
          isGlobalCompletion: false,
          isMemberCompletion: false,
          isNewIdentifierLocation: false,
          entries: items.map((item) => {
            let kind: ts.ScriptElementKind;

            switch (item.kind) {
              case CompletionItemKind.Function:
              case CompletionItemKind.Constructor:
                kind = ts.ScriptElementKind.functionElement;
                break;
              case CompletionItemKind.Field:
              case CompletionItemKind.Variable:
                kind = ts.ScriptElementKind.memberVariableElement;
                break;
              default:
                kind = ts.ScriptElementKind.unknown;
                break;
            }

            return {
              name: item.label,
              kindModifiers: "",
              kind,
              sortText: "",
            };
          }),
        };
      };

      proxy.getSemanticDiagnostics = (fileName: string) => {
        const _diagnostics = languageService.getSemanticDiagnostics(fileName);
        const _sourceFile = sourceFile(languageService, fileName);

        if (!_sourceFile) {
          return _diagnostics;
        }

        ts.forEachChild(_sourceFile, function visitor(node) {
          if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag)) {
            const tagName = node.tag.text;

            if (isGraphqlTag(tagName)) {
              const { query, offset } = _query(ts, schema, node);
              const graphqlDiagnostics = diagnostics(schema, source(query));

              for (const {
                range: { start, end },
                severity,
                message,
              } of graphqlDiagnostics) {
                _diagnostics.push({
                  category: diagnosticCategory(ts, severity),
                  code: 9999,
                  messageText: message,
                  file: _sourceFile,
                  start: start.character + offset,
                  length: end.character - start.character,
                });
              }
            }
          }

          ts.forEachChild(node, visitor);
        });

        return _diagnostics;
      };

      return proxy;
    },
  };
};

export default init;

if (typeof module !== "undefined" && typeof exports !== "undefined") {
  module.exports = Object.assign(init, exports);
}
