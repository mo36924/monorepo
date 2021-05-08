import type { Config } from "@mo36924/config";
import rollup from "./rollup";

export default async (config: Config) => {
  await rollup(config);
};
