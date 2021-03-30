import { context } from "@mo36924/graphql-react";
import type { MiddlewareFactory } from "@mo36924/http-server";
import type { Match } from "@mo36924/page-match";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import prepass from "react-ssr-prepass";

export default (match: Match): MiddlewareFactory => () => async (request, response) => {
  if (request.method !== "GET") {
    return;
  }

  const page = match(request._url);

  if (!page) {
    return;
  }

  const graphql = Object.create(null);

  const element = (
    <StrictMode>
      <context.Provider value={graphql}>{page}</context.Provider>
    </StrictMode>
  );

  await prepass(element);
  await response.send("<!DOCTYPE html>" + renderToString(element));
  return true;
};
