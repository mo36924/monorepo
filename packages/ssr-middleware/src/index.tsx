import type { MiddlewareFactory } from "@mo36924/http-server";
import type { Match } from "@mo36924/match-factory";
import { renderToString } from "react-dom/server";

export type Options = { match: Match };

export default ({ match }: Options): MiddlewareFactory => () => (request, response) => {
  if (request.method !== "GET") {
    return;
  }

  const element = match(request._url);

  if (!element) {
    return;
  }

  response.send("<!DOCTYPE html>" + renderToString(element));
  return true;
};
