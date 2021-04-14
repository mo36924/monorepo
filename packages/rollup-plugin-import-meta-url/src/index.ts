import type { Plugin } from "rollup";

export default (): Plugin => {
  return {
    name: "import-meta-url",
    resolveImportMeta(property, { format }) {
      if (property === "url" && format === "cjs") {
        return `require("url").pathToFileURL(__filename).href`;
      }

      return null;
    },
  };
};
