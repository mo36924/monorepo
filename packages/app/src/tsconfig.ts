import { writeFile } from "fs/promises";
import { resolve } from "path";
import { format, resolveConfig } from "@mo36924/prettier";

export default async () => {
  const tsconfigPath = resolve("tsconfig.json");
  const prettierConfig = resolveConfig.sync(tsconfigPath);

  const tsconfigJson = format(
    `{
      "compilerOptions": {
        "target": "ES2020",
        "module": "ES2020",
        "moduleResolution": "Node",
        "resolveJsonModule": true,
        "jsx": "preserve",
        "jsxImportSource": "react",
        "importsNotUsedAsValues": "error",
        "baseUrl": ".",
        "paths": {
          "~/*": ["./*"]
        },
        "strict": true,
        "esModuleInterop": true,
        "noEmitOnError": true,
        "importHelpers": true,
        "sourceMap": true,
        "inlineSourceMap": false,
        "inlineSources": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "plugins": [{ "name": "@mo36924/typescript-graphql-plugin" }]
      },
      "exclude": ["dist"]
    }`,
    { ...prettierConfig, filepath: tsconfigPath },
  );

  await writeFile(tsconfigPath, tsconfigJson);
};
