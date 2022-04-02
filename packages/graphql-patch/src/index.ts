import { readFileSync, writeFileSync } from "fs";

export default () => {
  const src = new URL("../../../graphql/package.json", import.meta.url);

  writeFileSync(
    src,
    JSON.stringify(
      {
        ...JSON.parse(readFileSync(src, "utf-8")),
        exports: {
          ".": {
            import: "./index.mjs",
            require: "./index.js",
            default: "./index.js",
          },
          "./*": {
            import: "./*.mjs",
            require: "./*.js",
            default: "./*.js",
          },
        },
      },
      null,
      2,
    ),
  );
};
