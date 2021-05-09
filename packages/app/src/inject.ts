import type { Config } from "@mo36924/config";
import { writeWithFormat } from "./util";

export default async (config: Config) => {
  let importType = "";
  let globalType = "";

  for (const [identifier, [source, name]] of Object.entries(config.inject)) {
    if (!name) {
      continue;
    }

    if (name === "default") {
      importType += `import type _${identifier} from "${source}";`;
    } else if (name === "*") {
      importType += `import type * as _${identifier} from "${source}";`;
    } else {
      importType += `import type { ${name} as _${identifier} } from "${source}";`;
    }

    globalType += `const ${identifier}: typeof _${identifier};`;
  }

  const type = `${importType}declare global{${globalType}}`;
  await writeWithFormat("types/inject.d.ts", type);
};
