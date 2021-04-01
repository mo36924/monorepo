import { context } from "@mo36924/graphql-react";
import type { ErrorMiddlewareFactory } from "@mo36924/http-server";
import page, { PageComponent, PromisePageModule } from "@mo36924/page";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import prepass from "react-ssr-prepass";

export default (errorPages: { [statusCode: string]: () => PromisePageModule<any> }): ErrorMiddlewareFactory => () => {
  const errorPageComponents: { [statusCode: string]: PageComponent<any> | undefined } = Object.create(null);
  const entries = Object.entries(errorPages);

  if (!entries.length) {
    return;
  }

  for (const [statusCode, errorPage] of entries) {
    errorPageComponents[statusCode] = page(errorPage);
  }

  return async (error, request, response) => {
    if (request.method !== "GET") {
      return;
    }

    const ErrorPageComponent = errorPageComponents[error.statusCode];

    if (!ErrorPageComponent) {
      return;
    }

    const graphql = Object.create(null);

    const element = (
      <StrictMode>
        <context.Provider value={graphql}>
          <ErrorPageComponent />
        </context.Provider>
      </StrictMode>
    );

    await prepass(element);
    await response.send("<!DOCTYPE html>" + renderToString(element));
    return true;
  };
};
