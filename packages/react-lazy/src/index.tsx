import type { ComponentType } from "react";

export type LazyComponent<T> = ComponentType<T> & { load: () => Promise<void> };

export default <T,>(loader: () => Promise<{ default: ComponentType<T> }>): LazyComponent<T> => {
  let promise: any;
  let Component: any;
  let error: any;

  const load = () =>
    (promise ||= loader().then(
      (exports: any) => {
        Component = exports.default;
      },
      (err: any) => {
        error = err;
      },
    ));

  const Lazy = (props: any) => {
    if (error) {
      throw error;
    }

    if (!Component) {
      load();
      throw promise;
    }

    return <Component {...props} />;
  };

  Lazy.load = load;
  return Lazy;
};
