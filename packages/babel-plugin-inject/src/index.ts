import { resolve } from "path";
import type { default as babel, PluginObj } from "@babel/core";

export type Options = {
  declarations?: {
    [name: string]: [source: string] | [source: string, name?: string];
  };
};

export default ({ types: t, template }: typeof babel, options: Options): PluginObj => {
  const injectOptions = Object.entries(options.declarations ?? {}).map(([identifier, imports]) => {
    if (imports[0][0] === ".") {
      imports = [resolve(imports[0]), imports[1]];
    }

    return [
      identifier,
      imports[0],
      imports[1] == null
        ? template.statement.ast(`import '${imports[0]}'`)
        : imports[1] === "default"
        ? template.statement.ast(`import ${identifier} from '${imports[0]}'`)
        : imports[1] === "*"
        ? template.statement.ast(`import * as ${identifier} from '${imports[0]}'`)
        : imports[1] === identifier
        ? template.statement.ast(`import { ${identifier} } from '${imports[0]}'`)
        : template.statement.ast(`import { ${imports[1]} as ${identifier} } from '${imports[0]}'`),
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
