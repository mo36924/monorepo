import type { MiddlewareFactory } from "@mo36924/http-server";
import type { Match } from "@mo36924/match-factory";
import { renderToString } from "react-dom/server";

export type Options = { match: Match };

export default ({ match }: Options): MiddlewareFactory => () => async (request, response) => {
  if (request.method !== "GET") {
    return;
  }

  const context = match(request._url);

  if (!context) {
    return;
  }

  await context.route.load();
  await response.send("<!DOCTYPE html>" + renderToString(<context.route {...context.props} />));
  return true;
};
