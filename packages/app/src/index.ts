import routeGenerator, { Options as routeGeneratorOptions } from "@mo36924/route-generator";

type Options = {
  routeGenerator?: routeGeneratorOptions;
};

export default async (options: Options = {}) => {
  await routeGenerator(options.routeGenerator);
};
