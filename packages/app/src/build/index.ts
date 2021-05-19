import type { Config } from "@mo36924/config";
import createAssets from "./create-assets";
import { asset, cache, config as _config, pathname } from "./plugins";
import rollup from "./rollup";

export default async (config: Config) => {
  const result = await Promise.all([
    rollup(config, "client", [pathname()]),
    rollup(config, "server", [pathname(), _config(config)]),
  ]);

  const chunks = result.flat();
  const { caches, pathnames } = await createAssets(config, chunks);
  const client = await rollup(config, "client", [asset(pathnames)]);
  client.forEach(({ fileName, code }) => (caches[`/${fileName}`] = code));

  await rollup(
    config,
    "server",
    [
      asset(pathnames),
      cache(caches),
      _config({
        ...config,
        clientUrl: `/${client[0].fileName}`,
        cssUrl: pathnames[config.css] ?? "",
        iconUrl: pathnames[config.icon] ?? "",
      }),
    ],
    true,
  );
};
