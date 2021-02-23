import { GraphQLError, printError } from "graphql";

export class GraphQLErrors extends Error {
  errors: ReadonlyArray<GraphQLError>;
  constructor(message: string, errors: ReadonlyArray<GraphQLError>) {
    super(message);
    this.name = "GraphQLErrors";
    this.errors = errors;
    Error.captureStackTrace(this, GraphQLErrors);
  }
  toString(): string {
    return this.errors.map(printError).join("\n\n");
  }
}
