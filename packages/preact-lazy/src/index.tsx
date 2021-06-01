import type { ComponentType } from "preact";

export default <T,>(
  loader: () => Promise<{ default: ComponentType<T> }>,
): ComponentType<T> & { load: () => Promise<void> } => {
  let promise: Promise<any> | undefined;
  let Component: ComponentType<T> | undefined;
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
