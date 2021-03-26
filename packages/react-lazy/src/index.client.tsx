import { useForceUpdate } from "@mo36924/react-hooks";
import type { ComponentType } from "react";

export type LazyComponent<T> = ComponentType<T> & { load: () => Promise<void> };

export default <T,>(loader: () => Promise<{ default: ComponentType<T> }>): LazyComponent<T> => {
  let promise: Promise<any> | undefined;
  let Component: ComponentType<T> | null = null;
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

  const Lazy = (props: T) => {
    const forceUpdate = useForceUpdate();

    if (error) {
      throw error;
    }

    Component || load().then(forceUpdate);
    return Component && <Component {...props} />;
  };

  Lazy.load = load;
  return Lazy;
};
