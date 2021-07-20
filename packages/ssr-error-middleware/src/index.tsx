import { context } from "@mo36924/graphql-preact";
import type { ErrorMiddlewareFactory } from "@mo36924/http-server";
import lazy from "@mo36924/preact-lazy";
import { createObjectNull } from "@mo36924/util";
import type { ComponentType } from "preact";
import render from "preact-render-to-string";
import prepass from "preact-ssr-prepass";

export default (errorPages: {
  [statusCode: string]: () => Promise<{ default: ComponentType<any> }>;
}): ErrorMiddlewareFactory => () => {
  const errorPageComponents: {
    [statusCode: string]: (ComponentType<any> & { load: () => Promise<void> }) | undefined;
  } = createObjectNull();

  const entries = Object.entries(errorPages);

  if (!entries.length) {
    return;
  }

  for (const [statusCode, errorPage] of entries) {
    errorPageComponents[statusCode] = lazy(errorPage);
  }

  return async (error, request, response) => {
    if (request.method !== "GET") {
      return;
    }

    const ErrorPageComponent = errorPageComponents[error.statusCode];

    if (!ErrorPageComponent) {
      return;
    }

    const graphql = createObjectNull();

    const element = (
      <context.Provider value={graphql}>
        <ErrorPageComponent />
      </context.Provider>
    );

    await prepass(element);
    await response.send("<!DOCTYPE html>" + render(element));
  };
};
