import { GraphQLError, GraphQLSchema, validateSchema as graphQLValidateSchema } from "graphql";
import httpError, { HttpError } from "http-errors";

export const validateSchema = (schema: GraphQLSchema) => {
  try {
    const graphQLErrors = graphQLValidateSchema(schema);

    if (graphQLErrors.length > 0) {
      return graphQLErrors;
    }
  } catch (rawError) {
    const error: HttpError = httpError(500, rawError instanceof Error ? rawError : String(rawError));
    return [new GraphQLError(error.message, undefined, undefined, undefined, undefined, error)];
  }

  return false;
};
