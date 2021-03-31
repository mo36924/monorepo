import { watch } from "fs";
import { readFile } from "fs/promises";
import type { IncomingMessage } from "http";
import { parse as querystring } from "querystring";
import type { Middleware } from "@mo36924/http-server";
import accepts from "accepts";
import type { GraphiQLOptions } from "express-graphql/renderGraphiQL";
import {
  buildASTSchema,
  buildSchema,
  DocumentNode,
  executeSync,
  getOperationAST,
  GraphQLError,
  parse,
  Source,
  specifiedRules,
  validate,
} from "graphql";
import httpError, { HttpError } from "http-errors";
import { formatResult } from "./format-result";
import { respondWithGraphiQL } from "./respond-with-graphiql";
import { send as defaultSend } from "./send";
import type { ExecutionResult, GraphQLParams, Options } from "./type";
import { validateSchema } from "./validate-schema";

export default async (options: Options): Promise<Middleware> => {
  let schema = buildASTSchema(options.ast);
  const execute = options.execute;
  const send = options.send ?? defaultSend;
  const graphiql = options.graphiql ?? true;
  let schemaValidationErrors = validateSchema(schema);
  const validationRules = specifiedRules;
  const url: string = (options.ast as any).url;

  if (url) {
    let data = await readFile(url, "utf8");
    schema = buildSchema(data);
    schemaValidationErrors = validateSchema(schema);

    watch(url, async (event, filename = url) => {
      if (event !== "change") {
        return;
      }

      const _data = await readFile(filename, "utf8");

      if (data === _data) {
        return;
      }

      data = _data;
      schema = buildSchema(data);
      schemaValidationErrors = validateSchema(schema);
    });
  }

  return async (request, response) => {
    const url = request.url;

    if (url === undefined) {
      return;
    }

    let params: GraphQLParams | undefined;
    let showGraphiQL: boolean = false;
    let graphiqlOptions: GraphiQLOptions | undefined;
    let result: ExecutionResult | undefined;

    try {
      const method = request.method;

      switch (method) {
        case "GET":
          if (url === "/graphql") {
            params = { query: "", variables: null, operationName: null };
          } else if (url.startsWith("/graphql?")) {
            params = getParams(request as IncomingMessage & { url: string });
          } else {
            return;
          }

          break;
        case "POST":
          if (url === "/graphql" || url.startsWith("/graphql?")) {
            params = await postParams(request);
          } else {
            return;
          }

          break;

        default:
          if (url === "/graphql" || url.startsWith("/graphql?")) {
            throw httpError(405, "GraphQL only supports GET and POST requests.", {
              headers: { Allow: "GET, POST" },
            });
          } else {
            return;
          }
      }

      showGraphiQL = graphiql && !params.raw && accepts(request).types(["json", "html"]) === "html";

      if (typeof graphiql !== "boolean") {
        graphiqlOptions = graphiql;
      }

      if (params.query === "") {
        if (showGraphiQL) {
          await respondWithGraphiQL(response, graphiqlOptions);
          return true;
        }

        throw httpError(400, "Must provide query string.");
      }

      if (schemaValidationErrors) {
        throw httpError(500, "GraphQL schema validation error.", {
          graphqlErrors: schemaValidationErrors,
        });
      }

      let document: DocumentNode;

      try {
        document = parse(new Source(params.query, "GraphQL request"));
      } catch (syntaxError) {
        throw httpError(400, "GraphQL syntax error.", {
          graphqlErrors: [syntaxError],
        });
      }

      const validationErrors = validate(schema, document, validationRules);

      if (validationErrors.length > 0) {
        throw httpError(400, "GraphQL validation error.", {
          graphqlErrors: validationErrors,
        });
      }

      if (method === "GET") {
        const operationAST = getOperationAST(document, params.operationName);

        if (operationAST && operationAST.operation !== "query") {
          if (showGraphiQL) {
            await respondWithGraphiQL(response, graphiqlOptions, params);
            return true;
          }

          throw httpError(405, `Can only perform a ${operationAST.operation} operation from a POST request.`, {
            headers: { Allow: "POST" },
          });
        }
      }

      if (params.operationName === "IntrospectionQuery") {
        result = executeSync({
          schema,
          document,
          variableValues: params.variables,
          operationName: params.operationName,
        });
      } else {
        result = await execute(request, response, schema, document, params.variables, params.operationName);
      }
    } catch (rawError) {
      const error: HttpError = httpError(500, rawError instanceof Error ? rawError : String(rawError));
      response.statusCode = error.status;
      const headers = error.headers;

      if (headers != null) {
        for (const [key, value] of Object.entries(headers)) {
          response.setHeader(key, String(value));
        }
      }

      if (error.graphqlErrors == null) {
        const graphqlError = new GraphQLError(error.message, undefined, undefined, undefined, undefined, error);
        result = { errors: [graphqlError] };
      } else {
        result = { errors: error.graphqlErrors };
      }
    }

    if (response.statusCode === 200 && result.data == null && result.raw === undefined) {
      response.statusCode = 500;
    }

    const formattedResult = formatResult(result);

    if (showGraphiQL) {
      await respondWithGraphiQL(response, graphiqlOptions, params, formattedResult);
      return true;
    }

    await send(request, response, formattedResult);
    return true;
  };
};

function getParams(req: IncomingMessage & { url: string }): GraphQLParams {
  const qs = querystring(req.url.slice(9));
  let query: string;
  const _query = qs.query;

  switch (typeof _query) {
    case "string":
      query = _query;
      break;
    case "object":
      query = _query[0];
      break;
    default:
      query = "";
      break;
  }

  let variables: { [key: string]: any } | null;
  let _variables = qs.variables;

  switch (typeof _variables) {
    case "object":
      _variables = _variables[0];
    case "string":
      try {
        variables = JSON.parse(_variables);
      } catch {
        throw httpError(400, "Variables are invalid JSON.");
      }

      break;
    default:
      variables = null;
      break;
  }

  let operationName: string | null;
  const _operationName = qs.operationName;

  switch (typeof _operationName) {
    case "string":
      operationName = _operationName;
      break;
    case "object":
      operationName = _operationName[0];
      break;
    default:
      operationName = null;
      break;
  }

  return {
    query,
    variables,
    operationName,
    raw: qs.raw !== undefined,
  };
}

async function postParams(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let totalLength = 0;

  for await (const chunk of req) {
    totalLength += chunk.length;

    if (totalLength > 102400) {
      throw httpError(413, "request entity too large", {
        received: totalLength,
        limit: 102400,
        type: "entity.too.large",
      });
    }

    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks, totalLength);
  let params: GraphQLParams;

  try {
    params = JSON.parse(body.toString("utf8"));
  } catch {
    throw httpError(400, "POST body sent invalid JSON.");
  }

  if (params === null || typeof params !== "object") {
    throw httpError(400, "Must provide query string.");
  }

  const query = params.query;

  if (typeof query !== "string") {
    throw httpError(400, "Must provide query string.");
  }

  const variables: { [key: string]: any } | null = typeof params.variables === "object" ? params.variables : null;
  const operationName = typeof params.operationName === "string" ? params.operationName : null;

  return {
    query,
    variables,
    operationName,
    raw: params.raw !== undefined,
  };
}
