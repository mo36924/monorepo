import type { IncomingMessage, ServerResponse } from "http";
import { parse as querystring } from "querystring";
import accepts from "accepts";
import type { GraphiQLData, GraphiQLOptions } from "express-graphql/renderGraphiQL";
import {
  DocumentNode,
  formatError,
  getOperationAST,
  GraphQLError,
  GraphQLFormattedError,
  GraphQLSchema,
  NoSchemaIntrospectionCustomRule,
  parse,
  Source,
  specifiedRules,
  validate,
  validateSchema,
} from "graphql";
import httpError, { HttpError } from "http-errors";

type ExecutionResult = { data?: string; errors?: readonly GraphQLError[] };
type FormattedExecutionResult = { data?: string; errors?: readonly GraphQLFormattedError[] };

export type Execute<T = {}> = (
  req: IncomingMessage,
  res: ServerResponse,
  context: T,
  schema: GraphQLSchema,
  document: DocumentNode,
  variables?: { [name: string]: any } | null,
  operationName?: string | null,
) => Promise<ExecutionResult>;
export type Send<T = {}> = (
  req: IncomingMessage,
  res: ServerResponse,
  context: T,
  result: FormattedExecutionResult,
) => Promise<any>;
export type Options<T = {}> = { schema: GraphQLSchema; context: T; execute: Execute<T>; send: Send<T> };
interface GraphQLParams {
  query: string;
  variables: { [name: string]: any } | null;
  operationName: string | null;
  raw?: boolean;
}

const prod = process.env.NODE_ENV === "production";
const validationRules = prod ? [...specifiedRules, NoSchemaIntrospectionCustomRule] : specifiedRules;

export default async <T>(options: Options<T>) => {
  const schema = options.schema;
  const schemaValidationErrors = getSchemaValidationErrors(schema);
  const execute = options.execute;
  const send = options.send;
  const context = options.context;

  return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
    const url = req.url;

    if (url === undefined) {
      return false;
    }

    let params: GraphQLParams | undefined;
    let showGraphiQL = !prod;
    let result: ExecutionResult | undefined;

    try {
      const method = req.method;

      switch (method) {
        case "GET":
          if (url === "/graphql") {
            if (prod) {
              throw httpError(400, "Must provide query string.");
            } else {
              params = { query: "", variables: null, operationName: null };
            }
          } else if (url.startsWith("/graphql?")) {
            params = getParams(req as IncomingMessage & { url: string });
          } else {
            return false;
          }

          break;
        case "POST":
          if (url === "/graphql") {
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

      if (!prod) {
        showGraphiQL = !params.raw && accepts(req).types(["json", "html"]) === "html";

        if (params.query === "") {
          if (showGraphiQL) {
            await respondWithGraphiQL(res);
            return true;
          }

          throw httpError(400, "Must provide query string.");
        }
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
          if (!prod) {
            if (showGraphiQL) {
              await respondWithGraphiQL(res, undefined, params);
              return true;
            }
          }

          throw httpError(405, `Can only perform a ${operationAST.operation} operation from a POST request.`, {
            headers: { Allow: "POST" },
          });
        }
      }

      result = await execute(req, res, context, schema, document, params.variables, params.operationName);
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

    if (res.statusCode === 200 && result.data == null) {
      res.statusCode = 500;
    }

    const formattedResult = formatResult(result);

    if (!prod) {
      if (showGraphiQL) {
        await respondWithGraphiQL(res, undefined, params, formattedResult);
        return true;
      }
    }

    await send(req, res, context, formattedResult);
    return true;
  };
};

function formatResult(result: ExecutionResult): FormattedExecutionResult {
  if (result.errors && result.errors.length > 0) {
    result.errors = result.errors.map(formatError) as any;
  }

  return result;
}

function getSchemaValidationErrors(schema: GraphQLSchema) {
  try {
    const graphQLErrors = validateSchema(schema);

    if (graphQLErrors.length > 0) {
      return graphQLErrors;
    }
  } catch (rawError) {
    const error: HttpError = httpError(500, rawError instanceof Error ? rawError : String(rawError));
    return [new GraphQLError(error.message, undefined, undefined, undefined, undefined, error)];
  }

  return false;
}

function getParams(req: IncomingMessage & { url: string }): GraphQLParams {
  const qs = querystring(req.url.slice(9));
  let query: string;
  const _query = qs.query;

  switch (_query) {
    case "string":
      query = _query;
      break;
    case "object":
      query = _query[0];
      break;
    default:
      if (prod) {
        throw httpError(400, "Must provide query string.");
      }

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

  if (!prod) {
    return {
      query,
      variables,
      operationName,
      raw: qs.raw !== undefined,
    };
  }

  return {
    query,
    variables,
    operationName,
  };
}

async function postParams(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  let totalLength = 0;

  for await (const chunk of req) {
    totalLength += chunk.length;

    if (102400 > totalLength) {
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

  if (!prod) {
    return {
      query,
      variables,
      operationName,
      raw: params.raw !== undefined,
    };
  }

  return {
    query,
    variables,
    operationName,
  };
}

async function respondWithGraphiQL(
  res: ServerResponse,
  options?: GraphiQLOptions,
  params?: GraphQLParams,
  result?: FormattedExecutionResult,
) {
  const data: GraphiQLData = {
    query: params?.query,
    variables: params?.variables,
    operationName: params?.operationName,
    result: result && (result.data ? JSON.parse(result.data) : result),
  };

  const { renderGraphiQL } = await import("express-graphql/renderGraphiQL");
  const payload = renderGraphiQL(data, options);
  const chunk = Buffer.from(payload, "utf8");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Length", chunk.length.toString());
  res.end(chunk);
}
