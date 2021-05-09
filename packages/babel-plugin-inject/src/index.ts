import { resolve } from "path";
import type { default as babel, PluginObj } from "@babel/core";

export type Options = {
  declarations?: {
    [identifier: string]: [source: string] | [source: string, name?: string];
  };
};

export default ({ types: t, template }: typeof babel, options: Options): PluginObj => {
  const injectOptions = Object.entries(options.declarations ?? {}).map(([identifier, [source, name]]) => {
    if (source[0] === ".") {
      source = resolve(source);
    }

    return [
      identifier,
      source,
      name == null
        ? template.statement.ast(`import '${source}'`)
        : name === "default"
        ? template.statement.ast(`import ${identifier} from '${source}'`)
        : name === "*"
        ? template.statement.ast(`import * as ${identifier} from '${source}'`)
        : name === identifier
        ? template.statement.ast(`import { ${identifier} } from '${source}'`)
        : template.statement.ast(`import { ${name} as ${identifier} } from '${source}'`),
    ] as const;
  });

  return {
    visitor: {
      Program(path, state) {
        const globals = (path.scope as any).globals;

        const importNodes = injectOptions
          .filter(([identifier, importFileName]) => globals[identifier] && state.filename !== importFileName)
          .map(([_identifier, _importFileName, importNode]) => t.cloneNode(importNode, true));

        path.unshiftContainer("body", importNodes);
      },
    },
  };
};
