import { buildTestData } from "@mo36924/graphql-schema";
import type { GraphQLSchema } from "graphql";
import { escape, escapeId, escapeUUID } from "./util";

export const createTestDataQuery = (schema: GraphQLSchema) => {
  let query = "set foreign_key_checks=0;\n";

  for (const { typeName, fieldNames, values } of buildTestData(schema)) {
    const table = escapeId(typeName);
    const columns = fieldNames.map(escapeId).join();

    const _values = values
      .map((v) => v.map(({ type: { name }, value }) => (name === "UUID" ? escapeUUID(value) : escape(value))))
      .map((v) => `(${v.join()})`)
      .join(",\n");

    query += `insert into ${table} (${columns}) values \n${_values};\n`;
  }

  query += "set foreign_key_checks=1;\n";
  return query;
};
