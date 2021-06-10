import { buildData as _buildData } from "@mo36924/graphql-data";
import { escape, escapeId } from "@mo36924/mysql-escape";

export const buildData = (graphql: string) => {
  let sql = "set foreign_key_checks=0;\n";

  for (const { typeName, fieldNames, values } of _buildData(graphql)) {
    const table = escapeId(typeName);
    const columns = fieldNames.map(escapeId).join();

    const _values = values
      .map((v) =>
        v.map(({ field: { type }, value }) => (type === "UUID" ? `uuid_to_bin(${escape(value)})` : escape(value))),
      )
      .map((v) => `(${v.join()})`)
      .join(",\n");

    sql += `insert into ${table} (${columns}) values \n${_values};\n`;
  }

  sql += "set foreign_key_checks=1;\n";
  return sql;
};
