import { config } from "@mo36924/graphql-config";
import { FilterPattern, createFilter } from "@rollup/pluginutils";
import { parse, stripIgnoredCharacters } from "graphql";
import { Plugin } from "rollup";

export type Options = { include?: FilterPattern; exclude?: FilterPattern };

export default (options: Options = {}): Plugin => {
  const filter = createFilter(options.include, options.exclude);
  const schema = "@mo36924/graphql-schema";
  return {
    name: "graphql",
    resolveId(source) {
      if (source === schema) {
        return source;
      }
    },
    async load(id) {
      if (id === schema) {
        return {
          code: `import { buildASTSchema } from "@mo36924/graphql-build";export default buildASTSchema(JSON.parse(${JSON.stringify(
            JSON.stringify(parse(stripIgnoredCharacters(config().graphql), { noLocation: true })),
          )}));`,
          map: { mappings: "" },
        };
      }
    },
    transform(code: string, id: string) {
      if ((!id.endsWith(".gql") && !id.endsWith(".graphql")) || !filter(id)) {
        return null;
      }

      try {
        return {
          code: `export default JSON.parse(${JSON.stringify(JSON.stringify(parse(code, { noLocation: true })))});`,
          map: { mappings: "" },
        };
      } catch (err) {
        const message = "Could not parse GraphQL file";
        this.warn({ id, message });
        return null;
      }
    },
  };
};
