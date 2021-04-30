import { resolve } from "path";
import { writeWithFormat } from "./util";

export default async () => {
  const tsconfigPath = resolve("tsconfig.json");

  await writeWithFormat(
    tsconfigPath,
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
  );
};
