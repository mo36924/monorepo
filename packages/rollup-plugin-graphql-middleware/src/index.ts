import { readFile } from "fs/promises";
import type { Config } from "@mo36924/config";
import { minify, schema as buildSchema } from "@mo36924/graphql-schema";
import { parse } from "graphql";
import type { Plugin, ResolvedId } from "rollup";

export default (options: Pick<Config, "database" | "graphql">): Plugin => {
  const id = "@mo36924/graphql-middleware";
  let resolvedId: ResolvedId | null | undefined;
  return {
    name: "graphql-schema",
    async buildStart() {
      resolvedId = await this.resolve(id, undefined, { skipSelf: true });
    },
    async resolveId(source) {
      if (source === id) {
        return resolvedId;
      }
    },
    async load(id) {
      if (id === resolvedId?.id) {
        const gql = await readFile(options.graphql, "utf8");
        const schema = await minify(buildSchema(gql));
        const ast = parse(schema, { noLocation: true });
        const { name, main, replica } = options.database;
        const json = JSON.stringify({ ast, main, replica });

        return `import graphqlMiddleware from "@mo36924/graphql-${name}-middleware";
export default () => async (server) => {
  const middlewareFactory = graphqlMiddleware(JSON.parse(${JSON.stringify(json)}));
  const middleware = await middlewareFactory(server);
  return middleware;
};
`;
      }
    },
  };
};
