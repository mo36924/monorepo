import { createFilter, FilterPattern } from "@rollup/pluginutils";
import { parse } from "graphql";
import type { Plugin } from "rollup";

export type Options = { include?: FilterPattern; exclude?: FilterPattern };

export default (options: Options = {}): Plugin => {
  const filter = createFilter(options.include, options.exclude);
  return {
    name: "graphql",
    transform(code: string, id: string) {
      if (!id.endsWith(".gql") || !id.endsWith(".graphql") || !filter(id)) {
        return null;
      }

      try {
        const documentNode = parse(code, { noLocation: true });
        const documentNodeJson = JSON.stringify(documentNode);

        const documentNodeString = documentNodeJson.includes("'")
          ? JSON.stringify(documentNodeJson)
          : `'${documentNodeJson}'`;

        return `export default JSON.parse(${documentNodeString});`;
      } catch (err) {
        const message = "Could not parse GraphQL file";
        this.warn({ id, message });
        return null;
      }
    },
  };
};
