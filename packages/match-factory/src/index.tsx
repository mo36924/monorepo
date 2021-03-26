import { ComponentType, ReactElement, Suspense } from "react";

export type StaticRoutes = { [path: string]: ComponentType<any> | undefined };
export type DynamicRoutes = [regexp: RegExp, names: string[], component: ComponentType<any>][];
export type Match = (url: URL) => ReactElement | null;

export default (staticRoutes: StaticRoutes, dynamicRoutes: DynamicRoutes): Match => {
  staticRoutes = Object.assign(Object.create(null), staticRoutes);

  return (url: URL) => {
    const pathname = url.pathname;
    const props: { [name: string]: string } = {};
    let Component = staticRoutes[pathname];

    if (!Component) {
      dynamicRoutes.some((dynamicRoute) => {
        const matches = pathname.match(dynamicRoute[0]);

        if (matches) {
          dynamicRoute[1].forEach((name, i) => (props[name] = matches[i + 1]));
          Component = dynamicRoute[2];
          return true;
        }
      });
    }

    return Component ? (
      <Suspense fallback={null}>
        <Component {...props} />
      </Suspense>
    ) : null;
  };
};
