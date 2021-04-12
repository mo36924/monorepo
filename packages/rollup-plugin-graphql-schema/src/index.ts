import { readFile } from "fs/promises";
import type { Config } from "@mo36924/config";
import { minify, schema as buildSchema } from "@mo36924/graphql-schema";
import { parse } from "graphql";
import type { Plugin, ResolvedId } from "rollup";

export default (options: Pick<Config, "graphql" | "database">): Plugin => {
  const id = "@mo36924/graphql-schema-middleware";
  let graphqlSchemaMiddleware: string | null = null;
  let resolvedId: ResolvedId | null;
  return {
    name: "graphql-schema",
    async buildStart() {
      const gql = await readFile(options.graphql, "utf8");
      const schema = await minify(buildSchema(gql));
      const ast = parse(schema, { noLocation: true });
      const { name, main, replica } = options.database;
      const json = JSON.stringify({ ast, main, replica });

      graphqlSchemaMiddleware = `import graphql from "@mo36924/graphql-${name}-json-middleware";
export default () => async (server) => {
  const middlewareFactory = graphql(JSON.parse(${JSON.stringify(json)}));
  const middleware = await middlewareFactory(server);
  return middleware;
};
`;

      resolvedId = await this.resolve(id, undefined, { skipSelf: true });
    },
    resolveId(source) {
      if (source === id) {
        return resolvedId;
      }
    },
    load(id) {
      if (id === resolvedId?.id) {
        return graphqlSchemaMiddleware;
      }
    },
  };
};
