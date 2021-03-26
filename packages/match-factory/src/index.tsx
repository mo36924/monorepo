import type { Request, Response } from "@mo36924/http-server";
import type { LazyComponent } from "@mo36924/react-lazy";
import type { ComponentType } from "react";

export type Props = { [name: string]: string };
export type Route<T> = Promise<{
  default: ComponentType<T>;
  getServerSideProps?(request: Request, response: Response): Promise<any>;
}>;
export type ImportRoute<T> = () => Route<T>;
export type StaticRoutes = { [path: string]: LazyComponent<any> | undefined };
export type DynamicRoutes = [regexp: RegExp, names: string[], component: LazyComponent<any>][];
export type Match = (url: URL) => { route: LazyComponent<any>; props: Props } | null;

export default (staticRoutes: StaticRoutes, dynamicRoutes: DynamicRoutes): Match => {
  staticRoutes = Object.assign(Object.create(null), staticRoutes);

  return (url: URL) => {
    const pathname = url.pathname;
    const props: { [name: string]: string } = {};
    let route = staticRoutes[pathname];

    if (!route) {
      dynamicRoutes.some((dynamicRoute) => {
        const matches = pathname.match(dynamicRoute[0]);

        if (matches) {
          dynamicRoute[1].forEach((name, i) => (props[name] = matches[i + 1]));
          route = dynamicRoute[2];
          return true;
        }
      });
    }

    return route ? { route, props } : null;
  };
};
