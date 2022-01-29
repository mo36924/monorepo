import type { FieldNode } from "graphql";
import { getArgumentValues } from "graphql/execution/values";
import { buildMutationContext, Context } from "./context";
import { createInsertQueries } from "./create";
import { createDeleteQueries } from "./delete";
import { createQuery } from "./query";
import { createUpdateQueries } from "./update";

const checkRowCount = "select 0 from (select if(row_count() <> 1, (select 0 union all select 1), 0)) t limit 0;";
const addCheckRowCount = (queries: string[]) => queries.flatMap((query) => [query, checkRowCount]);

export const createMutationQueries = (context: Context) => {
  const { operation, schema, variableValues } = context;
  const fields = schema.getMutationType()!.getFields();
  const queries: string[] = [];

  for (const field of operation.selectionSet.selections as FieldNode[]) {
    const name = field.name.value;
    const data: any = getArgumentValues(fields[name], field, variableValues).data;
    const mutationContext = buildMutationContext(context);
    let _queries: string[];

    switch (name) {
      case "create":
        _queries = createInsertQueries(mutationContext, data);
        break;
      case "update":
        _queries = createUpdateQueries(mutationContext, data);
        break;
      case "delete":
        _queries = createDeleteQueries(mutationContext, data);
        break;
      default:
        _queries = [];
        break;
    }

    queries.push(...addCheckRowCount(_queries), createQuery(mutationContext, field));
  }

  return queries;
};
