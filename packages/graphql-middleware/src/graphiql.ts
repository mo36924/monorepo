import type { IncomingMessage, ServerResponse } from "http";
import { parse as querystring } from "querystring";
import accepts from "accepts";
import type { GraphiQLOptions } from "express-graphql/renderGraphiQL";
import { DocumentNode, getOperationAST, GraphQLError, parse, Source, specifiedRules, validate } from "graphql";
import httpError, { HttpError } from "http-errors";
import { formatResult } from "./format-result";
import { respondWithGraphiQL } from "./respond-with-graphiql";
import { send as defaultSend } from "./send";
import type { ExecutionResult, GraphQLParams, Options } from "./type";
import { validateSchema } from "./validate-schema";

export default async (options: Options) => {
  const schema = options.schema;
  const execute = options.execute;
  const send = options.send ?? defaultSend;
  const graphiql = options.graphiql ?? false;
  const schemaValidationErrors = validateSchema(schema);
  const validationRules = specifiedRules;

  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = req.url;

    if (url === undefined) {
      return false;
    }

    let params: GraphQLParams | undefined;
    let showGraphiQL: boolean = false;
    let graphiqlOptions: GraphiQLOptions | undefined;
    let result: ExecutionResult | undefined;

    try {
      const method = req.method;

      switch (method) {
        case "GET":
          if (url === "/graphql") {
            params = { query: "", variables: null, operationName: null };
          } else if (url.startsWith("/graphql?")) {
            params = getParams(req as IncomingMessage & { url: string });
          } else {
            return false;
          }

          break;
        case "POST":
          if (url === "/graphql" || url.startsWith("/graphql?")) {
            params = await postParams(req);
          } else {
            return false;
          }

          break;

        default:
          if (url === "/graphql" || url.startsWith("/graphql?")) {
            throw httpError(405, "GraphQL only supports GET and POST requests.", {
              headers: { Allow: "GET, POST" },
            });
          } else {
            return false;
          }
      }

      showGraphiQL = graphiql && !params.raw && accepts(req).types(["json", "html"]) === "html";

      if (typeof graphiql !== "boolean") {
        graphiqlOptions = graphiql;
      }

      if (params.query === "") {
        if (showGraphiQL) {
          await respondWithGraphiQL(res, graphiqlOptions);
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
            await respondWithGraphiQL(res, graphiqlOptions, params);
            return true;
          }

          throw httpError(405, `Can only perform a ${operationAST.operation} operation from a POST request.`, {
            headers: { Allow: "POST" },
          });
        }
      }

      result = await execute(req, res, schema, document, params.variables, params.operationName);
    } catch (rawError) {
      const error: HttpError = httpError(500, rawError instanceof Error ? rawError : String(rawError));
      res.statusCode = error.status;
      const headers = error.headers;

      if (headers != null) {
        for (const [key, value] of Object.entries(headers)) {
          res.setHeader(key, String(value));
        }
      }

      if (error.graphqlErrors == null) {
        const graphqlError = new GraphQLError(error.message, undefined, undefined, undefined, undefined, error);
        result = { errors: [graphqlError] };
      } else {
        result = { errors: error.graphqlErrors };
      }
    }

    if (res.statusCode === 200 && result.data == null && result.raw === undefined) {
      res.statusCode = 500;
    }

    const formattedResult = formatResult(result);

    if (showGraphiQL) {
      await respondWithGraphiQL(res, graphiqlOptions, params, formattedResult);
      return true;
    }

    await send(req, res, formattedResult);
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
