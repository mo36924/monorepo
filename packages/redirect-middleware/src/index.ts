import type { MiddlewareFactory } from "@mo36924/http-server";

type Options = { [pathname: string]: string | [statusCode: number, pathname: string] };

export default (options: Options = {}): MiddlewareFactory => () => {
  const mapping: { [pathname: string]: [statusCode: number, pathname: string] } = Object.create(null);

  for (const [pathname, redirect] of Object.entries(options)) {
    if (typeof redirect === "string") {
      mapping[pathname] = [302, redirect];
    } else {
      mapping[pathname] = redirect;
    }
  }

  return (req, res) => {
    if (req.pathname in mapping) {
      res.redirect(...mapping[req.pathname]);
      return true;
    }
  };
};
