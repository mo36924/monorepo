import graphqlTag from "@mo36924/babel-plugin-graphql-tagged-template";
import babel from "@rollup/plugin-babel";
import react from "@vitejs/plugin-react";
import { PluginOption } from "vite";

export default (): PluginOption[] => {
  return [
    react(),
    babel({
      extensions: [".js", ".jsx", ".es6", ".es", ".mjs", ".ts", ".tsx"],
      plugins: [graphqlTag],
    }),
  ].flat();
};
