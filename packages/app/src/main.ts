import * as config from "@mo36924/config";
import devServer from "@mo36924/dev-server";
import pageGenerator from "@mo36924/page-generator";
import server from "./server";

export type Options = Partial<typeof config>;

export default async (options: Options = {}) => {
  options = { ...config, ...options };
  const { watch } = options;
  await pageGenerator({ ...options.page, watch });

  if (options.watch) {
    await devServer(options);
  } else {
    await server();
  }
};
