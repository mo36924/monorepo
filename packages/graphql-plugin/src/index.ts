import { readFileSync, unwatchFile, watch, watchFile } from "fs";
import { resolve } from "path";
import { printSchemaModel } from "@mo36924/graphql-schema";
import { buildSchema, GraphQLError, parse, validate } from "graphql";
import {
  getAutocompleteSuggestions,
  getDiagnostics,
  getHoverInformation,
  getTokenAtPosition,
} from "graphql-language-service-interface";
import { Position } from "graphql-language-service-utils";
import type { LanguageService, server, SourceFile, TaggedTemplateExpression } from "typescript/lib/tsserverlibrary";
import { CompletionItemKind, DiagnosticSeverity } from "vscode-languageserver-types";

const init: server.PluginModuleFactory = ({ typescript: ts }) => {
  return {
    create(info) {
      const languageService = info.languageService;
      const config = info.config;
      const cwd = info.project.getCurrentDirectory();
      const modelPath = config.model && resolve(cwd, config.model);
      const schemaPath = config.schema && resolve(cwd, config.schema);
      const watchPath = modelPath || schemaPath;
      let schema = buildSchema("scalar Unknown");

      const addScalarUnknownType = (schemaCode: string) =>
        schemaCode.includes("scalar Unknown") ? schemaCode : `${schemaCode}\nscalar Unknown`;

      const changeModel = () => {
        schema = buildSchema(addScalarUnknownType(printSchemaModel(readFileSync(modelPath, "utf8"))));
      };

      const changeSchema = () => {
        schema = buildSchema(addScalarUnknownType(readFileSync(schemaPath, "utf8")));
      };

      const update = modelPath ? changeModel : changeSchema;

      const listener = () => {
        try {
          update();
        } catch {}
      };

      try {
        update();
        watch(watchPath, listener);
      } catch {
        watchFile(watchPath, () => {
          try {
            update();
            watch(watchPath, listener);
            unwatchFile(watchPath);
          } catch {}
        });
      }

      const getSourceFile = (fileName: string) => languageService.getProgram()?.getSourceFile(fileName);

      const isGraphqlTag = (tag: string): tag is "query" | "mutation" | "subscription" => {
        switch (tag) {
          case "query":
          case "mutation":
          case "subscription":
            return true;
          default:
            return false;
        }
      };

      const getDiagnosticCategory = (severity?: number) => {
        switch (severity) {
          case DiagnosticSeverity.Error:
            return ts.DiagnosticCategory.Error;
          case DiagnosticSeverity.Warning:
            return ts.DiagnosticCategory.Warning;
          case DiagnosticSeverity.Information:
            return ts.DiagnosticCategory.Message;
          case DiagnosticSeverity.Hint:
            return ts.DiagnosticCategory.Suggestion;
          default:
            return ts.DiagnosticCategory.Error;
        }
      };

      const hover = (sourceFile: SourceFile, position: number) => {
        const tag = ts.forEachChild(sourceFile, function visitor(node): true | undefined | TaggedTemplateExpression {
          if (position < node.pos) {
            return true;
          }

          if (position >= node.end) {
            return;
          }

          if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && isGraphqlTag(node.tag.getText())) {
            const template = node.template;

            if (ts.isNoSubstitutionTemplateLiteral(template)) {
              if (position >= template.getStart() + 1 && position < template.getEnd() - 1) {
                return node;
              }
            } else {
              const head = template.head;

              if (position >= head.getStart() + 1 && position < head.getEnd() - 2) {
                return node;
              }

              for (const { literal } of template.templateSpans) {
                if (
                  position >= literal.getStart() + 1 &&
                  position < literal.getEnd() - (ts.isTemplateMiddle(literal) ? 2 : 1)
                ) {
                  return node;
                }
              }
            }
          }

          return ts.forEachChild(node, visitor);
        });

        if (tag === true) {
          return;
        }

        return tag;
      };

      const fix = (node: TaggedTemplateExpression) => {
        const template = node.template;
        let query = "";
        let variables = "";

        if (ts.isNoSubstitutionTemplateLiteral(template)) {
          // 2 ``
          const templateWidth = template.getWidth() - 2;
          query = template.text.padStart(templateWidth);
        } else {
          const head = template.head;
          const templateSpans = template.templateSpans;

          // 3 `...${
          const templateWidth = head.getWidth() - 3;
          query = head.text.padStart(templateWidth);

          templateSpans.forEach((span, i) => {
            const spanWidth = span.getFullWidth();
            const literal = span.literal;
            const literalWidth = literal.getWidth();
            const expressionWidth = spanWidth - literalWidth;
            const variableName = `$_${i}`;
            const variable = variableName.padStart(expressionWidth + 2).padEnd(expressionWidth + 3);
            const templateWidth = literalWidth - (ts.isTemplateTail(literal) ? 2 : 3);
            const template = literal.text.padStart(templateWidth);
            query += variable + template;
            variables += variableName + ":Unknown";
          });
        }

        const tag = node.tag.getText();
        let offset = template.getStart() + 1;
        query = query.replace(/\n|\r/g, " ");

        if (variables) {
          query = `${tag}(${variables}){${query}}`;
          offset -= tag.length + variables.length + 3;
        } else if (tag === "query") {
          query = `{${query}}`;
          offset -= 1;
        } else {
          query = `${tag}{${query}}`;
          offset -= tag.length + 1;
        }

        const documentNode = parse(query);
        const errors = validate(schema, documentNode);

        for (const error of errors) {
          const match = error.message.match(
            /^Variable ".*?" of type "Unknown" used in position expecting type "(.*?)"\.$/,
          );

          if (match) {
            query = query.replace("Unknown", match[1]);
            offset += 7 - match[1].length;
          }
        }

        return {
          query,
          offset,
        };
      };

      const proxy: LanguageService = Object.create(null);

      for (const [key, value] of Object.entries(languageService)) {
        (proxy as any)[key] = value.bind(languageService);
      }

      proxy.getQuickInfoAtPosition = (fileName, position) => {
        const sourceFile = getSourceFile(fileName);

        if (!sourceFile) {
          return undefined;
        }

        const tag = hover(sourceFile, position);

        if (!tag) {
          return languageService.getQuickInfoAtPosition(fileName, position);
        }

        let result: { query: string; offset: number };

        try {
          result = fix(tag);
        } catch {
          return languageService.getQuickInfoAtPosition(fileName, position);
        }

        const { query, offset } = result;
        const cursor = new Position(0, position - offset + 1);
        const token = getTokenAtPosition(query, cursor);
        const marked = getHoverInformation(schema, query, cursor, token);

        if (marked === "" || typeof marked !== "string") {
          return;
        }

        return {
          kind: ts.ScriptElementKind.string,
          textSpan: {
            start: offset + token.start,
            length: token.end - token.start,
          },
          kindModifiers: "",
          displayParts: [{ text: marked, kind: "" }],
        };
      };

      proxy.getCompletionsAtPosition = (fileName, position, options) => {
        const sourceFile = getSourceFile(fileName);

        if (!sourceFile) {
          return undefined;
        }

        const tag = hover(sourceFile, position);

        if (!tag) {
          return languageService.getCompletionsAtPosition(fileName, position, options);
        }

        let result: { query: string; offset: number };

        try {
          result = fix(tag);
        } catch {
          return languageService.getCompletionsAtPosition(fileName, position, options);
        }

        const { query, offset } = result;
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

      proxy.getSemanticDiagnostics = (fileName) => {
        const diagnostics = languageService.getSemanticDiagnostics(fileName);
        const sourceFile = getSourceFile(fileName);

        if (!sourceFile) {
          return diagnostics;
        }

        ts.forEachChild(sourceFile, function visitor(node) {
          if (ts.isTaggedTemplateExpression(node) && ts.isIdentifier(node.tag) && isGraphqlTag(node.tag.getText())) {
            try {
              const { query, offset } = fix(node);
              const _diagnostics = getDiagnostics(query, schema);

              for (const {
                range: { start, end },
                severity,
                message,
              } of _diagnostics) {
                diagnostics.push({
                  category: getDiagnosticCategory(severity),
                  code: 9999,
                  messageText: message,
                  file: sourceFile,
                  start: start.character + offset,
                  length: end.character - start.character,
                });
              }
            } catch (error) {
              if (error instanceof GraphQLError) {
                diagnostics.push({
                  category: ts.DiagnosticCategory.Error,
                  code: 9999,
                  messageText: error.message,
                  file: sourceFile,
                  start: node.template.getStart() + 1,
                  length: node.template.getWidth() - 2,
                });
              }
            }
          }

          ts.forEachChild(node, visitor);
        });

        return diagnostics;
      };

      return proxy;
    },
  };
};

export default init;
