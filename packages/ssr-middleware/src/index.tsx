import { context } from "@mo36924/graphql-preact";
import type { MiddlewareFactory } from "@mo36924/http-server";
import type { Match } from "@mo36924/page-match";
import { createObjectNull } from "@mo36924/utils";
import render from "preact-render-to-string";
import prepass from "preact-ssr-prepass";

export default (match: Match): MiddlewareFactory => () => async (request, response) => {
  if (request.method !== "GET") {
    return;
  }

  const page = match(request.$url);

  if (!page) {
    return;
  }

  const graphql = createObjectNull();
  const element = <context.Provider value={graphql}>{page}</context.Provider>;
  await prepass(element);
  await response.send("<!DOCTYPE html>" + render(element));
};
