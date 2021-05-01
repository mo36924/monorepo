import type { Config } from "@mo36924/config";
import server from "./server";

export default async (config: Config) => {
  await server(config);
};
