import { Plugin } from "esbuild";

export default ({ filter = /^[@\w]/ }: { filter?: RegExp } = {}): Plugin => ({
  name: "external",
  setup(build) {
    build.onResolve({ filter }, (args) => {
      return { external: args.kind !== "entry-point" };
    });
  },
});
