import type { ComponentType } from "react";

export type ImportPage<T> = () => Promise<PageModule<T>>;
export type PageComponent<T> = ComponentType<T> & { load: () => Promise<void> };
export type PageModule<T> = { default: ComponentType<T> };

export default <T,>(importPage: ImportPage<T>): PageComponent<T> => {
  let promise: any;
  let Component: ComponentType<T>;
  let error: any;

  const load = () =>
    (promise ||= importPage().then(
      (exports: any) => {
        Component = exports.default;
      },
      (err: any) => {
        error = err;
      },
    ));

  const Page = (props: any) => {
    if (error) {
      throw error;
    }

    if (!Component) {
      load();
      throw promise;
    }

    return <Component {...props} />;
  };

  Page.load = load;
  return Page;
};
