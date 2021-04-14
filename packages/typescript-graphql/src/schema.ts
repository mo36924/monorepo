import { readFileSync } from "fs";
import { graphql } from "@mo36924/config";
import { schema } from "@mo36924/graphql-schema";
import { buildSchema, GraphQLSchema } from "graphql";

let _gql = "";
let _graphQLSchema: GraphQLSchema = buildSchema("scalar Unknown");

const _schema = () => {
  try {
    const gql = readFileSync(graphql, "utf8");

    if (_gql !== gql) {
      const __schema = schema(gql);
      _graphQLSchema = buildSchema(__schema);
      _gql = gql;
    }
  } catch {}

  return _graphQLSchema;
};

export { _schema as schema };
