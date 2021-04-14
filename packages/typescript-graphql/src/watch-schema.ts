import { FSWatcher, watch } from "fs";
import { graphql } from "@mo36924/config";
import type { GraphQLSchema } from "graphql";
import { schema } from "./schema";

let _schema: GraphQLSchema | undefined;
let watcher: FSWatcher | undefined;

export const watchSchema = () => {
  if (!_schema) {
    _schema = schema();
  }

  if (!watcher) {
    try {
      watcher = watch(graphql, () => {
        _schema = schema();
      });
    } catch {}
  }

  return _schema;
};
