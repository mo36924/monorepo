import { buildData as _buildData } from "@mo36924/graphql-data";
import { escape, escapeId } from "@mo36924/postgres-escape";

export const buildData = (graphql: string) => {
  let disableForeignKeyCheck = "";
  let insert = "";
  let enableForeignKeyCheck = "";

  for (const { typeName, fieldNames, values } of _buildData(graphql)) {
    const table = escapeId(typeName);
    const columns = fieldNames.map(escapeId).join();

    const _values = values
      .map((v) => v.map(({ value }) => escape(value)))
      .map((v) => `(${v.join()})`)
      .join(",\n");

    disableForeignKeyCheck += `alter table ${escapeId(typeName)} disable trigger all;\n`;
    insert += `insert into ${table} (${columns}) values \n${_values};\n`;
    enableForeignKeyCheck += `alter table ${escapeId(typeName)} enable trigger all;\n`;
  }

  const sql = disableForeignKeyCheck + insert + enableForeignKeyCheck;
  return sql;
};
