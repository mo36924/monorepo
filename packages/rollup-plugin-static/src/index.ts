import cache from "@mo36924/rollup-plugin-cache";
import type { Plugin } from "rollup";

export default (): Plugin => {
  const plugin = cache({ middleware: "@mo36924/static-middleware", source: "**/*", dir: "static" });
  return {
    ...plugin,
    name: "static",
  };
};
