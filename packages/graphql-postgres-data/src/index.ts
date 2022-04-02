import { config } from "@mo36924/graphql-config";
import { buildModel } from "@mo36924/graphql-model";
import { escape, escapeId } from "@mo36924/postgres-escape";

export default (model?: string) => {
  const { data } = model ? buildModel(model) : config();
  let insert = "";

  for (const { name, fields, values } of data) {
    const table = escapeId(name);
    const columns = fields.map(escapeId).join();

    const _values = values
      .map((v) => v.map(({ value }) => escape(value)))
      .map((v) => `(${v.join()})`)
      .join(",\n");

    insert += `insert into ${table} (${columns}) values \n${_values};\n`;
  }

  const sql = insert;
  return sql;
};
