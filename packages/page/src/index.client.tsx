import { useForceUpdate } from "@mo36924/react-hooks";
import type { ComponentType } from "react";

export type PageComponent<T> = ComponentType<T> & { load: () => Promise<void> };
export type PageModule<T> = { default: ComponentType<T> };
export type PromisePageModule<T> = Promise<PageModule<T>>;
export type ImportPage<T> = () => PromisePageModule<T>;

export default <T,>(importPage: ImportPage<T>): PageComponent<T> => {
  let promise: Promise<any> | undefined;
  let Component: ComponentType<T> | null = null;
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

  const Page = (props: T) => {
    const forceUpdate = useForceUpdate();

    if (error) {
      throw error;
    }

    Component || load().then(forceUpdate);
    return Component && <Component {...props} />;
  };

  Page.load = load;
  return Page;
};
