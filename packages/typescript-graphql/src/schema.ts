import { promises, readFileSync, unwatchFile, watch, watchFile } from "fs";
import { graphql } from "@mo36924/config";
import { schema } from "@mo36924/graphql-schema";
import { buildSchema, GraphQLSchema } from "graphql";

const { readFile } = promises;
const buildSchemaWithUnknownType = (gql: string) => buildSchema(`scalar Unknown\n${schema(gql)}`);

export const getSchema = async () => {
  const gql = await readFile(graphql, "utf8");
  const schema = buildSchemaWithUnknownType(gql);
  return schema;
};

export const getSchemaSync = () => {
  const gql = readFileSync(graphql, "utf8");
  const schema = buildSchemaWithUnknownType(gql);
  return schema;
};

let _gql: string | undefined;
let _schema: GraphQLSchema | undefined;

const updateSchemaAsync = async () => {
  const gql = await readFile(graphql, "utf8");

  if (_gql === gql) {
    return;
  }

  const schema = buildSchemaWithUnknownType(gql);
  _gql = gql;
  _schema = schema;
  return schema;
};

const updateSchemaSync = () => {
  try {
    const gql = readFileSync(graphql, "utf8");
    const schema = buildSchemaWithUnknownType(gql);
    _gql = gql;
    _schema = schema;
  } catch {
    _gql = "";
    _schema = buildSchemaWithUnknownType(_gql);
  }

  return _schema;
};

export const watchSchema = (callback: (schema: GraphQLSchema) => void) => {
  try {
    const watcher = watch(graphql, async () => {
      try {
        const schema = await updateSchemaAsync();
        schema && callback(schema);
      } catch {
        watcher.close();
        watchSchema(callback);
      }
    });
  } catch {
    watchFile(graphql, async (stat) => {
      try {
        if (stat.isFile()) {
          const schema = await updateSchemaAsync();
          schema && callback(schema);
          unwatchFile(graphql);
          watchSchema(callback);
        }
      } catch {}
    });
  }

  _schema ??= updateSchemaSync();
  return _schema;
};
