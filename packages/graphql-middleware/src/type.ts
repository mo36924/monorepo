import type { IncomingMessage, ServerResponse } from "http";
import type { GraphiQLOptions } from "express-graphql/renderGraphiQL";
import type {
  DocumentNode,
  ExecutionResult as GraphQLExecutionResult,
  FormattedExecutionResult as GraphQLFormattedExecutionResult,
  GraphQLSchema,
} from "graphql";

export type ExecutionResult = GraphQLExecutionResult & {
  raw?: string;
};
export type FormattedExecutionResult = GraphQLFormattedExecutionResult & {
  raw?: string;
};
export type GraphQLParams = {
  query: string;
  variables: { [name: string]: any } | null;
  operationName: string | null;
  raw?: boolean;
};
export type Execute = (
  req: IncomingMessage,
  res: ServerResponse,
  schema: GraphQLSchema,
  document: DocumentNode,
  variables: { [name: string]: any } | null | undefined,
  operationName: string | null | undefined,
) => Promise<ExecutionResult>;
export type Send = (req: IncomingMessage, res: ServerResponse, result: FormattedExecutionResult) => Promise<any>;
export type Options = {
  schema: GraphQLSchema;
  execute: Execute;
  send?: Send;
  graphiql?: GraphiQLOptions | boolean;
};
