import type { Options } from "@mo36924/babel-plugin-inject";
import cosmiconfig from "./cosmiconfig";

const inject: Required<Options>["declarations"] = {
  ...cosmiconfig.inject,
};

export default inject;
