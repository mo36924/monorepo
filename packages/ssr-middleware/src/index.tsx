import type { MiddlewareFactory } from "@mo36924/http-server";
import type { Match } from "@mo36924/page-match";
import { renderToString } from "react-dom/server";
import prepass from "react-ssr-prepass";

export type Options = { match: Match };

export default ({ match }: Options): MiddlewareFactory => () => async (request, response) => {
  if (request.method !== "GET") {
    return;
  }

  const element = match(request._url);

  if (!element) {
    return;
  }

  await prepass(element);
  await response.send("<!DOCTYPE html>" + renderToString(element));
  return true;
};
